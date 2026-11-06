from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .routes import router
from .settings import NotConfiguredError, get_settings

app = FastAPI(title="golden-retriever backend")
app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_origins, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.exception_handler(NotConfiguredError)
async def _not_configured(_, e: NotConfiguredError):
    return JSONResponse({"detail": str(e)}, status_code=503)


@app.get("/health")
def health():
    return {"status": "ok"}
