from __future__ import annotations

from app.services.agronomy_service import _normalize, get_crop_knowledge


class TestNormalize:
    def test_strips_accents_and_lowercases(self) -> None:
        assert _normalize("Maíz") == "maiz"
        assert _normalize("Café") == "cafe"
        assert _normalize("Plátano") == "platano"

    def test_takes_first_word(self) -> None:
        assert _normalize("Caña de azúcar") == "cana"
        assert _normalize("Palma de aceite") == "palma"

    def test_aliases(self) -> None:
        assert _normalize("Banano") == "platano"


class TestGetCropKnowledge:
    def test_known_crop_returns_specific_card(self) -> None:
        text = get_crop_knowledge("Maíz")
        assert "Maíz" in text
        assert "Humedad de suelo" in text
        assert "Etapas críticas" in text

    def test_unknown_crop_falls_back_to_default(self) -> None:
        text = get_crop_knowledge("cultivo-inexistente-xyz")
        assert "guía general" in text.lower() or "tropical" in text.lower()

    def test_none_does_not_crash(self) -> None:
        text = get_crop_knowledge(None)
        assert isinstance(text, str) and len(text) > 0

    def test_accent_insensitive_lookup(self) -> None:
        # "Cafe" sin tilde debe recuperar la misma ficha que "Café"
        assert get_crop_knowledge("cafe") == get_crop_knowledge("Café")
