from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import anthropic
import httpx
import logfire
import yaml

from app.config import settings
from app.services.climate_service import ClimateData

# ─── Abstracción de proveedor LLM ─────────────────────────────────────────────

class LLMProvider(Protocol):
    """Interfaz común para todos los proveedores."""
    async def complete(
        self,
        system_prompt: str,
        user_content: str,
        max_tokens: int = 1024,
    ) -> tuple[str, int, int]:
        """Retorna (texto_respuesta, input_tokens, output_tokens)."""
        ...


class GroqProvider:
    """Proveedor Groq — gratis hasta 14,400 req/día con Llama 3.3 70B."""

    BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self) -> None:
        self.model = settings.GROQ_MODEL
        self._api_key = settings.GROQ_API_KEY

    async def complete(
        self, system_prompt: str, user_content: str, max_tokens: int = 1024
    ) -> tuple[str, int, int]:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_content},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(self.BASE_URL, json=payload, headers=headers)
            r.raise_for_status()

        data = r.json()
        text = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        return text, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)

    async def chat(
        self,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int = 800,
        image_base64: str | None = None,
        image_mime: str = "image/jpeg",
    ) -> tuple[str, int, int]:
        # If image provided, use vision model and inject image into last user message
        model = self.model
        final_messages = list(messages)
        if image_base64:
            model = "meta-llama/llama-4-scout-17b-16e-instruct"
            # Replace last user message content with multimodal array
            if final_messages and final_messages[-1]["role"] == "user":
                last_text = final_messages[-1]["content"]
                final_messages[-1] = {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": last_text},
                        {"type": "image_url", "image_url": {"url": f"data:{image_mime};base64,{image_base64}"}},
                    ],
                }

        payload = {
            "model": model,
            "messages": [{"role": "system", "content": system_prompt}] + final_messages,
            "max_tokens": max_tokens,
            "temperature": 0.4,
        }
        headers = {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=45) as client:
            r = await client.post(self.BASE_URL, json=payload, headers=headers)
            r.raise_for_status()
        data = r.json()
        usage = data.get("usage", {})
        return data["choices"][0]["message"]["content"], usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)


class AnthropicProvider:
    """Proveedor Anthropic Claude (fallback de pago)."""

    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model   = settings.LLM_MODEL

    async def complete(
        self, system_prompt: str, user_content: str, max_tokens: int = 1024
    ) -> tuple[str, int, int]:
        response = await self._client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )
        return (
            response.content[0].text,
            response.usage.input_tokens,
            response.usage.output_tokens,
        )

    async def chat(self, system_prompt: str, messages: list[dict], max_tokens: int = 800) -> tuple[str, int, int]:
        response = await self._client.messages.create(
            model=self.model, max_tokens=max_tokens,
            system=system_prompt, messages=messages,
        )
        return response.content[0].text, response.usage.input_tokens, response.usage.output_tokens


class OllamaProvider:
    """Proveedor Ollama local (desarrollo / testing sin créditos)."""

    def __init__(self) -> None:
        self.base_url = settings.OLLAMA_BASE_URL
        self.model    = settings.OLLAMA_MODEL

    async def complete(
        self, system_prompt: str, user_content: str, max_tokens: int = 1024
    ) -> tuple[str, int, int]:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_content},
            ],
            "options": {"temperature": 0.2, "num_predict": max_tokens},
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(f"{self.base_url}/api/chat", json=payload)
            r.raise_for_status()

        data = r.json()
        text = data["message"]["content"]
        prompt_tokens = len(system_prompt.split()) + len(user_content.split())
        output_tokens = len(text.split())
        return text, prompt_tokens, output_tokens

    async def chat(self, system_prompt: str, messages: list[dict], max_tokens: int = 800) -> tuple[str, int, int]:
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "options": {"temperature": 0.4, "num_predict": max_tokens},
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(f"{self.base_url}/api/chat", json=payload)
            r.raise_for_status()
        text = r.json()["message"]["content"]
        tokens = len(text.split())
        return text, tokens, tokens


def _build_provider() -> GroqProvider | AnthropicProvider | OllamaProvider:
    if settings.LLM_PROVIDER == "groq":
        return GroqProvider()
    if settings.LLM_PROVIDER == "ollama":
        return OllamaProvider()
    return AnthropicProvider()


def _model_name() -> str:
    if settings.LLM_PROVIDER == "groq":
        return f"groq/{settings.GROQ_MODEL}"
    if settings.LLM_PROVIDER == "ollama":
        return f"ollama/{settings.OLLAMA_MODEL}"
    return settings.LLM_MODEL


@dataclass
class AnalysisResult:
    alert_level: str
    main_alert: str | None
    water_stress_index: float
    irrigation_needed: bool
    next_irrigation_date: str | None
    avg_temperature_c: float
    total_rain_7d_mm: float
    avg_vpd_kpa: float
    et0_7d_mm: float
    recommendations: list[dict]
    summary_for_farmer: str
    model_used: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    prompt_version: str


@dataclass
class AlertTriageResult:
    is_alert: bool
    severity: str
    title: str
    description: str
    action: str
    response_time: str


@dataclass
class DailySummaryResult:
    emoji_status: str
    summary_text: str
    top_priority: str
    week_outlook: str


@dataclass
class PromptEvalResult:
    prompt_path: str
    avg_quality: float
    avg_latency_ms: float
    total_cost_usd: float
    valid_json_pct: float
    has_required_fields_pct: float


@dataclass
class ComparisonResult:
    v1: PromptEvalResult
    v2: PromptEvalResult
    recommendation: str


PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


class LLMService:
    def __init__(self) -> None:
        self._provider: GroqProvider | AnthropicProvider | OllamaProvider = _build_provider()
        self._prompt_cache: dict[str, dict] = {}

    @property
    def client(self) -> anthropic.AsyncAnthropic:
        if isinstance(self._provider, AnthropicProvider):
            return self._provider._client
        raise RuntimeError("PromptEvaluator solo disponible con proveedor Anthropic")

    def load_prompt(self, name: str) -> dict:
        if name not in self._prompt_cache:
            path = PROMPTS_DIR / name
            if not path.exists():
                raise FileNotFoundError(f"Prompt no encontrado: {path}")
            with open(path) as f:
                self._prompt_cache[name] = yaml.safe_load(f)
        return self._prompt_cache[name]

    def _cost(self, input_tokens: int, output_tokens: int) -> float:
        if settings.LLM_PROVIDER == "groq":
            return 0.0  # Groq free tier
        if settings.LLM_PROVIDER == "ollama":
            return 0.0
        # claude-haiku-4-5-20251001 pricing
        return round(input_tokens * 0.00000025 + output_tokens * 0.00000125, 6)

    async def analyze_farm(
        self,
        climate_data: ClimateData,
        crop_type: str,
        farm_name: str,
        sensor_data: dict | None = None,
        max_output_tokens: int = 800,
    ) -> AnalysisResult:
        with logfire.span("llm.analyze_farm", farm=farm_name, crop=crop_type):
            prompt_cfg = self.load_prompt("farm_analysis_v1.0.yaml")

            etc_daily = 0.0
            if climate_data.daily:
                et0_avg = climate_data.et0_total_7d / len(climate_data.daily)
                from app.services.kpi_service import KPIService
                etc_daily = KPIService().calculate_etc(et0_avg, crop_type)

            water_deficit = max(0, climate_data.et0_total_7d * 1.0 - climate_data.rain_total_7d)

            sensor_section = "Sin sensor IoT conectado (usando solo datos climáticos)"
            if sensor_data:
                sensor_section = "\n".join(
                    f"  {k}: {v}" for k, v in sensor_data.items()
                )

            user_content = prompt_cfg["user_template"].format(
                farm_name=farm_name,
                crop_type=crop_type,
                location=climate_data.location_name,
                analysis_date=climate_data.daily[0].date if climate_data.daily else "hoy",
                temp_min=climate_data.temp_min_7d,
                temp_max=climate_data.temp_max_7d,
                temp_avg=round(climate_data.temp_avg_7d, 1),
                rain_total=climate_data.rain_total_7d,
                rain_prob_max=climate_data.rain_prob_max_7d,
                et0_total=round(climate_data.et0_total_7d, 1),
                vpd_avg=climate_data.vpd_avg,
                uv_max=climate_data.uv_max_7d,
                sensor_section=sensor_section,
                etc_daily=etc_daily,
                water_deficit=round(water_deficit, 1),
                water_stress_index=min(10.0, round(water_deficit / 5, 1)),
            )

            raw_text, input_tokens, output_tokens = await self._provider.complete(
                system_prompt=prompt_cfg["system_prompt"],
                user_content=user_content,
                max_tokens=max_output_tokens,
            )
            raw_text = raw_text.strip()

            # Extraer JSON si viene envuelto en markdown
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                raw_text = raw_text.split("```")[1].split("```")[0].strip()

            data = json.loads(raw_text)

            return AnalysisResult(
                alert_level=data.get("alert_level", "ok"),
                main_alert=data.get("main_alert"),
                water_stress_index=float(data.get("water_stress_index", 0)),
                irrigation_needed=bool(data.get("irrigation_needed", False)),
                next_irrigation_date=data.get("next_irrigation_date"),
                avg_temperature_c=float(data.get("avg_temperature_c", climate_data.temp_avg_7d)),
                total_rain_7d_mm=float(data.get("total_rain_7d_mm", climate_data.rain_total_7d)),
                avg_vpd_kpa=float(data.get("avg_vpd_kpa", climate_data.vpd_avg)),
                et0_7d_mm=float(data.get("et0_7d_mm", climate_data.et0_total_7d)),
                recommendations=data.get("recommendations", []),
                summary_for_farmer=data.get("summary_for_farmer", ""),
                model_used=_model_name(),
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=self._cost(input_tokens, output_tokens),
                prompt_version=prompt_cfg.get("version", "1.0.0"),
            )

    async def triage_alert(
        self,
        sensor_reading: dict,
        threshold_violations: list[str],
        crop_type: str,
    ) -> AlertTriageResult:
        with logfire.span("llm.triage_alert"):
            prompt_cfg = self.load_prompt("alert_triage_v1.0.yaml")
            user_content = prompt_cfg["user_template"].format(
                device_id=sensor_reading.get("device_id", "unknown"),
                farm_id=sensor_reading.get("farm_id", "unknown"),
                crop_type=crop_type,
                sensor_json=json.dumps(sensor_reading, indent=2, default=str),
                violations_list="\n".join(f"- {v}" for v in threshold_violations),
                recent_history="Sin historial disponible",
            )
            raw, _, _ = await self._provider.complete(
                system_prompt=prompt_cfg["system_prompt"],
                user_content=user_content,
                max_tokens=256,
            )
            raw = raw.strip()
            if "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
                if raw.startswith("json"):
                    raw = raw[4:].strip()
            data = json.loads(raw)
            return AlertTriageResult(
                is_alert=data.get("is_alert", False),
                severity=data.get("severity", "info"),
                title=data.get("title", "Alerta de sensor"),
                description=data.get("description", ""),
                action=data.get("action", ""),
                response_time=data.get("response_time", "today"),
            )

    async def generate_daily_summary(
        self,
        farm_name: str,
        analyses_7d: list[dict],
        kpis_today: dict,
    ) -> DailySummaryResult:
        with logfire.span("llm.daily_summary", farm=farm_name):
            prompt_cfg = self.load_prompt("daily_summary_v1.0.yaml")
            from datetime import date
            user_content = prompt_cfg["user_template"].format(
                farm_name=farm_name,
                date=date.today().strftime("%d/%m/%Y"),
                kpis_json=json.dumps(kpis_today, indent=2, default=str),
                analyses_summary=json.dumps(analyses_7d[-3:] if analyses_7d else [], indent=2),
                forecast_48h="Ver dashboard para pronóstico actualizado",
            )
            raw, _, _ = await self._provider.complete(
                system_prompt=prompt_cfg["system_prompt"],
                user_content=user_content,
                max_tokens=512,
            )
            raw = raw.strip()
            if "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
                if raw.startswith("json"):
                    raw = raw[4:].strip()
            data = json.loads(raw)
            return DailySummaryResult(
                emoji_status=data.get("emoji_status", "🟡"),
                summary_text=data.get("summary_text", ""),
                top_priority=data.get("top_priority", ""),
                week_outlook=data.get("week_outlook", ""),
            )

    async def chat_with_analysis(
        self,
        message: str,
        history: list[dict],
        analysis_context: dict | None = None,
        image_base64: str | None = None,
        image_mime: str = "image/jpeg",
    ) -> tuple[str, int, int]:
        system = (
            "Eres SURQO, un agrónomo colombiano con 20 años de experiencia en campo. "
            "Tienes conocimiento profundo de todos los cultivos legales colombianos y das consejos "
            "prácticos y directos, como si estuvieras visitando la finca en persona.\n\n"

            "## TU CONOCIMIENTO EXPERTO\n"
            "CULTIVOS: café, cacao, plátano, banano, maíz, yuca, arroz, caña, aguacate, mango, "
            "naranja, limón, mora, fresa, tomate, pimentón, pepino, habichuela, papa, cebolla, "
            "flores de corte, palma, soya, algodón, stevia, menta, orégano y hortalizas en general.\n\n"

            "NUTRICIÓN VEGETAL:\n"
            "- Nitrógeno (N): crecimiento, hojas verdes. Deficiencia = amarillamiento de hojas viejas.\n"
            "- Fósforo (P): raíces y floración. Deficiencia = hojas moradas/rojizas, raíz débil.\n"
            "- Potasio (K): calidad de fruto, resistencia. Deficiencia = bordes marrones en hojas.\n"
            "- Calcio: frutos firmes, punta negra en tomate. Boro: floración y cuajado.\n"
            "- Magnesio: clorosis internervial (hoja amarilla con nervios verdes).\n"
            "- Zinc: hojas pequeñas arrugadas. Hierro: amarillamiento en hojas jóvenes.\n\n"

            "PLAGAS Y ENFERMEDADES COMUNES:\n"
            "- Hongos: antracnosis (manchas oscuras), mildiu (polvo blanco), botrytis (moho gris), "
            "  sigatoka (plátano), roya (café/fríjol), Fusarium (marchitez).\n"
            "  → Fungicidas: Mancozeb 2g/L, Propiconazol, Tebuconazol, Cobre (Cupravit).\n"
            "- Bacterias: marchitez bacteriana, cancros, pudriciones blandas.\n"
            "  → Antibióticos cúpricos, desinfección de herramientas.\n"
            "- Insectos: áfidos/pulgones, mosca blanca, trips, ácaros, barrenador, cogollero, broca (café).\n"
            "  → Insecticidas: Clorpirifos, Imidacloprid, Abamectina, Spinosad, Acefato.\n"
            "  → Biológicos: Beauveria bassiana, Metarhizium, Trichoderma.\n"
            "- Nemátodos: raíz deforme, plantas débiles.\n"
            "  → Nematicidas: Cadusafos, Carbofuran. Biológico: Purín de ají.\n\n"

            "ETAPAS FENOLÓGICAS (aplica a la etapa correcta):\n"
            "- Germinación/establecimiento: enfocarse en raíz, fósforo, micorrizas.\n"
            "- Desarrollo vegetativo: nitrógeno para crecer, controlar maleza y plagas foliares.\n"
            "- Floración: reducir nitrógeno, aumentar potasio y boro. NO fumigar insecticidas en flor abierta.\n"
            "- Cuajado y llenado: calcio + potasio, riego uniforme, vigilar hongos en fruto.\n"
            "- Maduración: reducir riego, potasio para calidad, cosechar en punto justo.\n\n"

            "CUANDO EL AGRICULTOR SUBE UNA FOTO:\n"
            "1. Diagnostica qué ves: color de hojas, manchas, síntomas en tallo, fruto o raíz.\n"
            "2. Identifica el problema principal (carencia nutricional, hongo, insecto, quemadura).\n"
            "3. Da el nombre del problema en lenguaje simple + solución concreta con producto y dosis.\n"
            "4. Indica urgencia: ¿hay que actuar hoy, esta semana o es preventivo?\n\n"

            "## ESTILO DE RESPUESTA\n"
            "- Habla como agrónomo que visita la finca: directo, práctico, sin rodeos.\n"
            "- Puedes usar términos técnicos SI los explicas en una frase.\n"
            "- Da productos reales con nombre comercial colombiano y dosis cuando aplica.\n"
            "- Máximo 4-5 oraciones o 3 puntos concretos. No listas de 10 cosas.\n"
            "- Da LA mejor recomendación para el caso, no una lista de posibilidades.\n"
            "- Si es urgente, dilo claro: 'Esto hay que atenderlo esta semana o se pierde el lote.'\n"
            "- Si necesitas más info, haz UNA pregunta concreta.\n"
            "- Nunca digas 'según el análisis' o 'de acuerdo con los datos'. Habla natural.\n\n"

            "EJEMPLOS:\n"
            "Pregunta: 'Las hojas se están poniendo amarillas'\n"
            "Mal: 'La clorosis puede deberse a múltiples deficiencias nutricionales...'\n"
            "Bien: '¿Las hojas viejas de abajo o las nuevas de arriba? Si son las de abajo, es falta de nitrógeno — échale urea 46% a 2 gramos por litro. Si son las nuevas, puede ser hierro o zinc.'\n\n"

            "Pregunta: 'Cuándo debo abonar'\n"
            "Mal: 'La fertilización depende de múltiples factores...'\n"
            "Bien: 'Para café en llenado de grano: abona con un 10-30-10 o similar, 150g por planta. No esperes más de una semana o el grano sale peludo. Si ya está en maduración, con potasio (KCl) es suficiente.'"
        )

        if analysis_context:
            system += f"\n\n## DATOS DEL ANÁLISIS DE ESTA FINCA\n{json.dumps(analysis_context, ensure_ascii=False, indent=2)}"

        msgs = [{"role": h["role"], "content": h["content"]} for h in history[-10:]]
        msgs.append({"role": "user", "content": message})

        if isinstance(self._provider, GroqProvider):
            text, inp, out = await self._provider.chat(
                system_prompt=system, messages=msgs, max_tokens=700,
                image_base64=image_base64, image_mime=image_mime,
            )
        else:
            text, inp, out = await self._provider.chat(
                system_prompt=system, messages=msgs, max_tokens=700,
            )
        return text, inp, out


class PromptEvaluator:
    def __init__(self, llm_service: LLMService) -> None:
        self.llm = llm_service

    async def evaluate_single(
        self, prompt_path: str, test_input: dict
    ) -> dict:
        start = time.monotonic()
        prompt_cfg = self.llm.load_prompt(prompt_path)
        required_fields = prompt_cfg.get("response_required_fields", [])

        try:
            user_content = prompt_cfg["user_template"].format(**test_input)
            response = await self.llm.client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=prompt_cfg.get("max_tokens", 1024),
                system=prompt_cfg["system_prompt"],
                messages=[{"role": "user", "content": user_content}],
            )
            raw = response.content[0].text.strip()
            latency_ms = (time.monotonic() - start) * 1000
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            cost = self.llm._cost(input_tokens, output_tokens)

            # Validar JSON
            is_valid = False
            parsed = {}
            try:
                if "```json" in raw:
                    raw = raw.split("```json")[1].split("```")[0].strip()
                elif "```" in raw:
                    raw = raw.split("```")[1].split("```")[0].strip()
                parsed = json.loads(raw)
                is_valid = True
            except json.JSONDecodeError:
                pass

            has_fields = all(f in parsed for f in required_fields) if is_valid else False
            quality = await self.llm_judge(raw, test_input) if is_valid else 0.0

            return {
                "prompt_path": prompt_path,
                "latency_ms": round(latency_ms, 1),
                "cost_usd": cost,
                "is_valid_json": is_valid,
                "has_required_fields": has_fields,
                "quality_score": quality,
            }
        except Exception as e:
            return {
                "prompt_path": prompt_path,
                "error": str(e),
                "latency_ms": (time.monotonic() - start) * 1000,
                "cost_usd": 0.0,
                "is_valid_json": False,
                "has_required_fields": False,
                "quality_score": 0.0,
            }

    async def llm_judge(self, output: str, context: dict) -> float:
        try:
            response = await self.llm.client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=50,
                system="Eres un evaluador experto en agronomía colombiana.",
                messages=[{
                    "role": "user",
                    "content": (
                        f"Evalúa esta respuesta agronómica del 0.0 al 1.0 según:\n"
                        f"precisión(0.4) + accionabilidad(0.3) + completitud(0.2) + formato(0.1)\n\n"
                        f"RESPUESTA:\n{output[:500]}\n\n"
                        f"Responde SOLO con un número decimal entre 0.0 y 1.0"
                    ),
                }],
            )
            return float(response.content[0].text.strip())
        except Exception:
            return 0.5

    async def compare_versions(
        self, v1_path: str, v2_path: str, test_cases: list[dict]
    ) -> ComparisonResult:
        v1_results = [await self.evaluate_single(v1_path, tc) for tc in test_cases]
        v2_results = [await self.evaluate_single(v2_path, tc) for tc in test_cases]

        def summarize(results: list[dict], path: str) -> PromptEvalResult:
            n = len(results)
            return PromptEvalResult(
                prompt_path=path,
                avg_quality=sum(r["quality_score"] for r in results) / n,
                avg_latency_ms=sum(r["latency_ms"] for r in results) / n,
                total_cost_usd=sum(r["cost_usd"] for r in results),
                valid_json_pct=sum(1 for r in results if r["is_valid_json"]) / n,
                has_required_fields_pct=sum(1 for r in results if r["has_required_fields"]) / n,
            )

        v1_summary = summarize(v1_results, v1_path)
        v2_summary = summarize(v2_results, v2_path)

        if v2_summary.avg_quality > v1_summary.avg_quality + 0.05:
            recommendation = f"Usar {v2_path}: mejor calidad ({v2_summary.avg_quality:.2f} vs {v1_summary.avg_quality:.2f})"
        elif v1_summary.avg_quality >= v2_summary.avg_quality:
            recommendation = f"Mantener {v1_path}: igual o mejor calidad con costo similar"
        else:
            recommendation = "Las versiones son equivalentes — considerar latencia y costo"

        return ComparisonResult(v1=v1_summary, v2=v2_summary, recommendation=recommendation)
