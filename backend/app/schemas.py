from pydantic import BaseModel, Field, field_validator


class Chunk(BaseModel):
    text: str = Field(max_length=20_000)
    doc_uri: str | None = None

    @field_validator("text")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be blank")
        return v


class SuggestQuestionRequest(BaseModel):
    chunks: list[Chunk] = Field(min_length=1, max_length=30)
    previous_questions: list[str] = Field(default_factory=list, max_length=10)


class SuggestQuestionResponse(BaseModel):
    question: str
