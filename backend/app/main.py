from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import templates, reports, comments, versions, attachments

app = FastAPI(title="Ledgerly Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(templates.router)
app.include_router(reports.router)
app.include_router(comments.router)
app.include_router(versions.router)
app.include_router(attachments.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
