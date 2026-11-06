import logging

from fastapi import APIRouter, Depends, HTTPException
from langchain_core.runnables import Runnable

from .llm import build_llm
from .prompts import load_prompts
from .question_chain import suggest_question
from .schemas import SuggestQuestionRequest, SuggestQuestionResponse
from .settings import NotConfiguredError, get_settings

log = logging.getLogger(__name__)
router = APIRouter()


def get_llm() -> Runnable:
    """Dependency so tests can swap in a fake model."""
    settings = get_settings()
    # prompts.yaml is re-read per request (see config/prompts.yaml), including its temperature.
    try:
        return build_llm(settings, load_prompts(settings.prompts_path).temperature)
    except NotConfiguredError as e:
        raise HTTPException(503, str(e)) from e


@router.post("/api/suggest-question", response_model=SuggestQuestionResponse)
def post_suggest_question(req: SuggestQuestionRequest, llm: Runnable = Depends(get_llm)):
    try:
        prompts = load_prompts(get_settings().prompts_path)
    except (OSError, ValueError) as e:
        raise HTTPException(500, f"Prompt config problem: {e}") from e
    try:
        question = suggest_question(llm, prompts, req.chunks, req.previous_questions)
    except Exception as e:  # noqa: BLE001 - surface any provider error to the UI
        log.exception("suggest-question failed")
        raise HTTPException(502, f"Model call failed: {e}") from e
    if not question:
        raise HTTPException(502, "Model returned an empty question")
    return SuggestQuestionResponse(question=question)
