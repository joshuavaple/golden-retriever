from dataclasses import dataclass
from pathlib import Path

import yaml


@dataclass(frozen=True)
class Prompts:
    system: str
    user: str
    temperature: float | None = None


def load_prompts(path: Path) -> Prompts:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8")) or {}
    for key in ("system", "user"):
        if not isinstance(data.get(key), str) or not data[key].strip():
            raise ValueError(f"{path}: missing or empty '{key}'")
    for placeholder in ("{chunks}", "{previous_questions}"):
        if placeholder not in data["user"]:
            raise ValueError(f"{path}: 'user' template must contain {placeholder}; it needs both chunks and previous_questions")
    temperature = data.get("temperature")
    return Prompts(system=data["system"], user=data["user"], temperature=None if temperature is None else float(temperature))
