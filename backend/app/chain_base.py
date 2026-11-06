from langchain_core.messages import SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate
from langchain_core.runnables import Runnable

from .prompts import Prompts
from .schemas import Chunk


def format_chunks(chunks: list[Chunk]) -> str:
    return "\n\n".join(f"[{i}] ({c.doc_uri}) {c.text}" if c.doc_uri else f"[{i}] {c.text}" for i, c in enumerate(chunks, 1))


def run_chain(llm: Runnable, prompts: Prompts, variables: dict[str, str]) -> str:
    """prompt | llm | parser, shared by the question and answer chains.

    The system text goes in as a message (not a template) so braces in it stay literal;
    user-supplied values are passed as variables, so braces inside them are not interpreted.
    """
    prompt = ChatPromptTemplate.from_messages([SystemMessage(content=prompts.system), HumanMessagePromptTemplate.from_template(prompts.user)])
    return (prompt | llm | StrOutputParser()).invoke(variables)
