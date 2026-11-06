from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.main import app
from app.routes import get_answer_llm, get_question_llm
from app.settings import NotConfiguredError

client = TestClient(app)
BODY = {"chunks": [{"text": "Closing costs run 2-5% of the price.", "doc_uri": "guide.pdf"}]}


def use_llm(llm, dep=get_question_llm):
    app.dependency_overrides[dep] = lambda: llm


def teardown_function():
    app.dependency_overrides.clear()


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_suggest_question_returns_the_question():
    use_llm(RunnableLambda(lambda _: AIMessage(content="What else should I budget for?")))
    r = client.post("/api/suggest-question", json=BODY)
    assert r.status_code == 200
    assert r.json() == {"question": "What else should I budget for?"}


def test_previous_questions_reach_the_prompt():
    seen = []
    use_llm(RunnableLambda(lambda pv: (seen.append(pv.to_string()), AIMessage(content="q"))[1]))
    client.post("/api/suggest-question", json={**BODY, "previous_questions": ["old one?"]})
    assert "old one?" in seen[0]


def test_empty_chunks_are_rejected():
    use_llm(RunnableLambda(lambda _: AIMessage(content="q")))
    assert client.post("/api/suggest-question", json={"chunks": []}).status_code == 422
    assert client.post("/api/suggest-question", json={"chunks": [{"text": "  "}]}).status_code == 422


def test_missing_azure_config_is_503_with_a_helpful_message():
    def boom():
        raise NotConfiguredError("Set AZURE_OPENAI_API_KEY")

    app.dependency_overrides[get_question_llm] = boom
    r = client.post("/api/suggest-question", json=BODY)
    assert r.status_code == 503
    assert "AZURE_OPENAI_API_KEY" in r.json()["detail"]


def test_model_failure_is_502():
    def fail(_):
        raise RuntimeError("quota exceeded")

    use_llm(RunnableLambda(fail))
    r = client.post("/api/suggest-question", json=BODY)
    assert r.status_code == 502
    assert "quota exceeded" in r.json()["detail"]


ANSWER_BODY = {**BODY, "question": "How much should I budget for closing?"}


def test_suggest_answer_returns_the_answer():
    use_llm(RunnableLambda(lambda _: AIMessage(content="About 2-5% of the price.")), get_answer_llm)
    r = client.post("/api/suggest-answer", json=ANSWER_BODY)
    assert r.status_code == 200
    assert r.json() == {"answer": "About 2-5% of the price."}


def test_answer_endpoint_uses_the_answer_prompt_not_the_question_prompt():
    seen = []
    use_llm(RunnableLambda(lambda pv: (seen.append(pv.to_string()), AIMessage(content="a"))[1]), get_answer_llm)
    client.post("/api/suggest-answer", json=ANSWER_BODY)
    text = seen[0]
    assert "How much should I budget for closing?" in text
    assert "Closing costs run 2-5%" in text
    assert "Questions already suggested" not in text


def test_answer_requires_a_question_and_chunks():
    use_llm(RunnableLambda(lambda _: AIMessage(content="a")), get_answer_llm)
    assert client.post("/api/suggest-answer", json=BODY).status_code == 422
    assert client.post("/api/suggest-answer", json={**BODY, "question": "  "}).status_code == 422
    assert client.post("/api/suggest-answer", json={"question": "q", "chunks": []}).status_code == 422


def test_answer_missing_azure_config_is_503():
    def boom():
        raise NotConfiguredError("Set AZURE_OPENAI_API_KEY")

    app.dependency_overrides[get_answer_llm] = boom
    assert client.post("/api/suggest-answer", json=ANSWER_BODY).status_code == 503


def test_answer_model_failure_is_502():
    def fail(_):
        raise RuntimeError("quota exceeded")

    use_llm(RunnableLambda(fail), get_answer_llm)
    r = client.post("/api/suggest-answer", json=ANSWER_BODY)
    assert r.status_code == 502 and "quota exceeded" in r.json()["detail"]
