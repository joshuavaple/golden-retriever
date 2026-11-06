from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.prompts import Prompts
from app.question_chain import suggest_question
from app.schemas import Chunk

PROMPTS = Prompts(system="SYS {literal}", user="C:\n{chunks}\nP:\n{previous_questions}", temperature=None)


def fake_llm(reply: str, seen: list):
    def run(prompt_value):
        seen.append(prompt_value.to_messages())
        return AIMessage(content=reply)

    return RunnableLambda(run)


def test_returns_the_model_text_stripped_of_quotes_and_whitespace():
    q = suggest_question(fake_llm('  "What should I budget for?"\n', []), PROMPTS, [Chunk(text="t")], [])
    assert q == "What should I budget for?"


def test_system_prompt_is_sent_verbatim_and_chunks_are_numbered_with_their_source():
    seen: list = []
    suggest_question(
        fake_llm("q", seen), PROMPTS, [Chunk(text="alpha", doc_uri="a.pdf"), Chunk(text="beta")], []
    )
    system, human = seen[0]
    assert system.content == "SYS {literal}"
    assert "[1] (a.pdf) alpha" in human.content
    assert "[2] beta" in human.content


def test_previous_questions_are_listed_or_marked_none():
    seen: list = []
    suggest_question(fake_llm("q", seen), PROMPTS, [Chunk(text="t")], [])
    assert "(none)" in seen[0][1].content
    suggest_question(fake_llm("q", seen), PROMPTS, [Chunk(text="t")], ["first?", "second?"])
    assert "- first?" in seen[1][1].content and "- second?" in seen[1][1].content


def test_chunk_text_with_braces_is_not_treated_as_a_template():
    seen: list = []
    suggest_question(fake_llm("q", seen), PROMPTS, [Chunk(text="use {x} and {{y}}")], [])
    assert "use {x} and {{y}}" in seen[0][1].content
