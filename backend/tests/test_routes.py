from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.main import app
from app.routes import get_llm
from app.settings import NotConfiguredError

client = TestClient(app)
BODY = {"chunks": [{"text": "Closing costs run 2-5% of the price.", "doc_uri": "guide.pdf"}]}


def use_llm(llm):
    app.dependency_overrides[get_llm] = lambda: llm


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

    app.dependency_overrides[get_llm] = boom
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
