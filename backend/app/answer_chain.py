from langchain_core.runnables import Runnable

from .chain_base import format_chunks, run_chain
from .prompts import Prompts
from .schemas import Chunk


def suggest_answer(llm: Runnable, prompts: Prompts, question: str, chunks: list[Chunk]) -> str:
    return run_chain(llm, prompts, {"question": question, "chunks": format_chunks(chunks)}).strip()
