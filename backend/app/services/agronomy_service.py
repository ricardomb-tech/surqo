from __future__ import annotations

import unicodedata
from functools import lru_cache
from pathlib import Path

import yaml

_KNOWLEDGE_PATH = Path(__file__).parent.parent / "knowledge" / "crops.yaml"

# Sinónimos → clave canónica en crops.yaml
_ALIASES = {
    "banano": "platano",
    "cafeto": "cafe",
    "maize": "maiz",
}


@lru_cache(maxsize=1)
def _load_knowledge() -> dict:
    with open(_KNOWLEDGE_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _normalize(crop_type: str) -> str:
    """"Maíz" -> "maiz", "Caña de azúcar" -> "cana", "Plátano/Banano" -> "platano"."""
    s = unicodedata.normalize("NFKD", crop_type).encode("ascii", "ignore").decode()
    s = s.lower().strip()
    # primera palabra significativa (ignora "de", "azúcar", etc.)
    first = s.split()[0] if s.split() else s
    return _ALIASES.get(first, first)


def get_crop_knowledge(crop_type: str | None) -> str:
    """Recupera la ficha agronómica del cultivo y la formatea como bloque de texto
    para inyectar al prompt del análisis. Cae al `_default` si no hay ficha."""
    kb = _load_knowledge()
    key = _normalize(crop_type or "")
    card = kb.get(key) or kb.get("_default", {})
    if not card:
        return "Sin ficha agronómica disponible."

    lines = [f"CULTIVO: {card.get('nombre', crop_type)} — referencia agronómica (trópico colombiano)"]
    campos = [
        ("humedad_suelo", "Humedad de suelo"),
        ("temperatura", "Temperatura"),
        ("vpd", "VPD"),
        ("etapas_criticas", "Etapas críticas"),
        ("plagas_clima", "Plagas/enfermedades y clima que las favorece"),
        ("notas", "Notas"),
    ]
    for campo, etiqueta in campos:
        if card.get(campo):
            lines.append(f"- {etiqueta}: {card[campo]}")
    return "\n".join(lines)
