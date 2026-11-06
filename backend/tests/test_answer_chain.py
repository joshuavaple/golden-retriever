from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.answer_chain import suggest_answer
from app.prompts import Prompts
from app.schemas import Chunk

PROMPTS = Prompts(system="SYS {literal}", user="Q: {question}\nC:\n{chunks}", temperature=None)


def fake_llm(reply: str, seen: list):
    def run(prompt_value):
        seen.append(prompt_value.to_messages())
        return AIMessage(content=reply)

    return RunnableLambda(run)


def test_returns_the_model_text_stripped():
    assert suggest_answer(fake_llm("  Budget 2-5% for closing.\n", []), PROMPTS, "How much?", [Chunk(text="t")]) == "Budget 2-5% for closing."


def test_keeps_quotes_and_multiple_lines_inside_an_answer():
    reply = 'Two things:\n- "closing costs"\n- taxes'
    assert suggest_answer(fake_llm(reply, []), PROMPTS, "q", [Chunk(text="t")]) == reply


def test_prompt_carries_question_and_numbered_chunks_and_verbatim_system():
    seen: list = []
    suggest_answer(fake_llm("a", seen), PROMPTS, "What else {costs}?", [Chunk(text="alpha", doc_uri="a.pdf"), Chunk(text="beta")])
    system, human = seen[0]
    assert system.content == "SYS {literal}"
    assert "Q: What else {costs}?" in human.content
    assert "[1] (a.pdf) alpha" in human.content and "[2] beta" in human.content
