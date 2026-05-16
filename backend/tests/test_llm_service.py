from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.services.llm_service import LLMService, PromptEvaluator


PROMPTS_DIR = Path(__file__).parent.parent / "app" / "prompts"


def test_load_prompt_farm_analysis() -> None:
    svc = LLMService.__new__(LLMService)
    svc._prompt_cache = {}
    svc.client = MagicMock()

    prompt = svc.load_prompt("farm_analysis_v1.0.yaml")
    assert "version" in prompt
    assert "system_prompt" in prompt
    assert "user_template" in prompt
    assert "response_required_fields" in prompt


def test_load_prompt_alert_triage() -> None:
    svc = LLMService.__new__(LLMService)
    svc._prompt_cache = {}
    svc.client = MagicMock()

    prompt = svc.load_prompt("alert_triage_v1.0.yaml")
    assert "is_alert" in prompt["response_required_fields"]


def test_cost_calculation() -> None:
    svc = LLMService.__new__(LLMService)
    svc._prompt_cache = {}
    svc.client = MagicMock()

    cost = svc._cost(1000, 500)
    # 1000 * 0.00000025 + 500 * 0.00000125 = 0.00025 + 0.000625 = 0.000875
    assert cost == pytest.approx(0.000875, rel=0.01)


def test_load_prompt_caches() -> None:
    svc = LLMService.__new__(LLMService)
    svc._prompt_cache = {}
    svc.client = MagicMock()

    prompt1 = svc.load_prompt("farm_analysis_v1.0.yaml")
    prompt2 = svc.load_prompt("farm_analysis_v1.0.yaml")
    assert prompt1 is prompt2  # Mismo objeto del cache


def test_load_prompt_missing_raises() -> None:
    svc = LLMService.__new__(LLMService)
    svc._prompt_cache = {}
    svc.client = MagicMock()

    with pytest.raises(FileNotFoundError):
        svc.load_prompt("no_existe_v99.yaml")
