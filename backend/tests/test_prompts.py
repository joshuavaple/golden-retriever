from pathlib import Path

import pytest

from app.prompts import ANSWER_PLACEHOLDERS, QUESTION_PLACEHOLDERS, Prompts, load_prompts

CONFIG = Path(__file__).parent.parent / "config"


@pytest.mark.parametrize("name,placeholders", [("question_prompts.yaml", QUESTION_PLACEHOLDERS), ("answer_prompts.yaml", ANSWER_PLACEHOLDERS)])
def test_real_configs_load_with_their_placeholders(name, placeholders):
    p = load_prompts(CONFIG / name, placeholders)
    assert p.system.strip()
    for ph in placeholders:
        assert "{" + ph + "}" in p.user


def test_question_and_answer_placeholders_differ():
    assert "previous_questions" in QUESTION_PLACEHOLDERS and "question" in ANSWER_PLACEHOLDERS
    assert "previous_questions" not in ANSWER_PLACEHOLDERS


def test_temperature_is_optional(tmp_path):
    f = tmp_path / "p.yaml"
    f.write_text("system: s\nuser: '{chunks}'\n")
    assert load_prompts(f, ("chunks",)) == Prompts(system="s", user="{chunks}", temperature=None)


def test_missing_key_is_reported(tmp_path):
    f = tmp_path / "p.yaml"
    f.write_text("system: s\n")
    with pytest.raises(ValueError, match="user"):
        load_prompts(f, ("chunks",))


def test_user_template_missing_a_required_placeholder_is_rejected(tmp_path):
    f = tmp_path / "p.yaml"
    f.write_text("system: s\nuser: '{chunks}'\n")
    with pytest.raises(ValueError, match="question"):
        load_prompts(f, ("chunks", "question"))
