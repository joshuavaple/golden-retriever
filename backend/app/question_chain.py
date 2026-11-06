from langchain_core.runnables import Runnable

from .chain_base import format_chunks, run_chain
from .prompts import Prompts
from .schemas import Chunk


def _format_previous(previous: list[str]) -> str:
    return "\n".join(f"- {q}" for q in previous) if previous else "(none)"


def suggest_question(llm: Runnable, prompts: Prompts, chunks: list[Chunk], previous_questions: list[str]) -> str:
    text = run_chain(llm, prompts, {"chunks": format_chunks(chunks), "previous_questions": _format_previous(previous_questions)})
    return text.strip().strip("\"'“”‘’").strip()
