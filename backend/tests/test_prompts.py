from pathlib import Path

import pytest

from app.prompts import Prompts, load_prompts

REAL = Path(__file__).parent.parent / "config" / "prompts.yaml"


def test_real_config_loads_with_required_placeholders():
    p = load_prompts(REAL)
    assert p.system.strip()
    assert "{chunks}" in p.user
    assert "{previous_questions}" in p.user


def test_temperature_is_optional(tmp_path):
    f = tmp_path / "p.yaml"
    f.write_text("system: s\nuser: '{chunks} {previous_questions}'\n")
    assert load_prompts(f) == Prompts(system="s", user="{chunks} {previous_questions}", temperature=None)


def test_missing_key_is_reported(tmp_path):
    f = tmp_path / "p.yaml"
    f.write_text("system: s\n")
    with pytest.raises(ValueError, match="user"):
        load_prompts(f)


def test_user_template_without_chunks_placeholder_is_rejected(tmp_path):
    f = tmp_path / "p.yaml"
    f.write_text("system: s\nuser: no placeholders here\n")
    with pytest.raises(ValueError, match="chunks"):
        load_prompts(f)
