from langchain_core.messages import SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate
from langchain_core.runnables import Runnable

from .prompts import Prompts
from .schemas import Chunk


def _format_chunks(chunks: list[Chunk]) -> str:
    return "\n\n".join(f"[{i}] ({c.doc_uri}) {c.text}" if c.doc_uri else f"[{i}] {c.text}" for i, c in enumerate(chunks, 1))


def _format_previous(previous: list[str]) -> str:
    return "\n".join(f"- {q}" for q in previous) if previous else "(none)"


def suggest_question(llm: Runnable, prompts: Prompts, chunks: list[Chunk], previous_questions: list[str]) -> str:
    # The system text goes in as a message (not a template) so braces in it stay literal.
    prompt = ChatPromptTemplate.from_messages([SystemMessage(content=prompts.system), HumanMessagePromptTemplate.from_template(prompts.user)])
    chain = prompt | llm | StrOutputParser()
    # Chunk text is passed as a variable value, so braces inside it are not interpreted.
    text = chain.invoke({"chunks": _format_chunks(chunks), "previous_questions": _format_previous(previous_questions)})
    return text.strip().strip("\"'“”‘’").strip()
