import logging
from collections.abc import Callable
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from langchain_core.runnables import Runnable

from .answer_chain import suggest_answer
from .llm import build_llm
from .prompts import ANSWER_PLACEHOLDERS, QUESTION_PLACEHOLDERS, Prompts, load_prompts
from .question_chain import suggest_question
from .schemas import (
    SuggestAnswerRequest,
    SuggestAnswerResponse,
    SuggestQuestionRequest,
    SuggestQuestionResponse,
)
from .settings import NotConfiguredError, get_settings

log = logging.getLogger(__name__)
router = APIRouter()


def _load(path: Path, placeholders: tuple[str, ...]) -> Prompts:
    # Prompt files are re-read per request (see config/*.yaml), so edits need no restart.
    try:
        return load_prompts(path, placeholders)
    except (OSError, ValueError) as e:
        raise HTTPException(500, f"Prompt config problem: {e}") from e


def _llm_for(path: Path, placeholders: tuple[str, ...]) -> Runnable:
    settings = get_settings()
    try:
        return build_llm(settings, _load(path, placeholders).temperature)
    except NotConfiguredError as e:
        raise HTTPException(503, str(e)) from e


def get_question_llm() -> Runnable:
    """Dependencies so tests can swap in a fake model. Each function has its own prompt file and temperature."""
    return _llm_for(get_settings().question_prompts_path, QUESTION_PLACEHOLDERS)


def get_answer_llm() -> Runnable:
    return _llm_for(get_settings().answer_prompts_path, ANSWER_PLACEHOLDERS)


def _call_model(fn: Callable[[], str], what: str) -> str:
    try:
        text = fn()
    except Exception as e:  # noqa: BLE001 - surface any provider error to the UI
        log.exception("%s failed", what)
        raise HTTPException(502, f"Model call failed: {e}") from e
    if not text:
        raise HTTPException(502, f"Model returned an empty {what}")
    return text


@router.post("/api/suggest-question", response_model=SuggestQuestionResponse)
def post_suggest_question(req: SuggestQuestionRequest, llm: Runnable = Depends(get_question_llm)):
    prompts = _load(get_settings().question_prompts_path, QUESTION_PLACEHOLDERS)
    question = _call_model(lambda: suggest_question(llm, prompts, req.chunks, req.previous_questions), "question")
    return SuggestQuestionResponse(question=question)


@router.post("/api/suggest-answer", response_model=SuggestAnswerResponse)
def post_suggest_answer(req: SuggestAnswerRequest, llm: Runnable = Depends(get_answer_llm)):
    prompts = _load(get_settings().answer_prompts_path, ANSWER_PLACEHOLDERS)
    answer = _call_model(lambda: suggest_answer(llm, prompts, req.question, req.chunks), "answer")
    return SuggestAnswerResponse(answer=answer)
