from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

import yaml


# Placeholders each prompt file's `user` template must contain.
QUESTION_PLACEHOLDERS = ("chunks", "previous_questions")
ANSWER_PLACEHOLDERS = ("question", "chunks")


@dataclass(frozen=True)
class Prompts:
    system: str
    user: str
    temperature: float | None = None


def load_prompts(path: Path, placeholders: Iterable[str]) -> Prompts:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    for key in ("system", "user"):
        if not isinstance(data.get(key), str) or not data[key].strip():
            raise ValueError(f"{path}: missing or empty '{key}'")
    for name in placeholders:
        if "{" + name + "}" not in data["user"]:
            raise ValueError(f"{path}: 'user' template must contain {{{name}}}")
    temperature = data.get("temperature")
    return Prompts(system=data["system"], user=data["user"], temperature=None if temperature is None else float(temperature))
