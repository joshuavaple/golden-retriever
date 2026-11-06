# golden-retriever backend

Small FastAPI service that suggests a question, and then an answer, from the passages selected in the frontend. It is a separate process: the frontend works without it (the suggest button then shows a "backend not reachable" message), and the backend does not need the frontend.

## Run

```bash
cd backend
cp .env.example .env        # fill in the Azure OpenAI endpoint, key, deployment
uv sync
uv run uvicorn app.main:app --reload --port 8000
uv run pytest               # tests use a fake model, no network or credentials
```

The frontend dev server (`npm run dev` in `frontend/`) proxies `/api` to `127.0.0.1:8000`.

## API

`POST /api/suggest-question`
```json
{ "chunks": [{ "text": "...", "doc_uri": "guide.pdf" }], "previous_questions": ["..."] }
```
returns `{ "question": "..." }`.

`POST /api/suggest-answer`
```json
{ "question": "...", "chunks": [{ "text": "...", "doc_uri": "guide.pdf" }] }
```
returns `{ "answer": "..." }`.

Errors carry `{ "detail": "..." }`: 422 invalid body, 503 Azure not configured, 502 model call failed, 500 bad prompt file.

## Changing the prompt

Each function has its own file, re-read on every request, so no restart is needed. A file holds the system prompt, the user template and the sampling temperature (remove it for deployments that reject a temperature).

- [config/question_prompts.yaml](config/question_prompts.yaml): the user template must keep `{chunks}` and `{previous_questions}`.
- [config/answer_prompts.yaml](config/answer_prompts.yaml): the user template must keep `{question}` and `{chunks}`.

## Layout

- `app/main.py` app, CORS, `/health`
- `app/routes.py` the two endpoints and the `get_question_llm` / `get_answer_llm` dependencies
- `app/chain_base.py` shared chunk formatting and the prompt | model | parser runner
- `app/question_chain.py`, `app/answer_chain.py` one thin chain per function
- `app/llm.py` builds `AzureChatOpenAI`; the one place to switch from API key to a service principal
- `app/prompts.py`, `app/settings.py`, `app/schemas.py`
