from fastapi import FastAPI

from app.routers import example

app = FastAPI(title="SIRA Python API", version="0.1.0")

app.include_router(example.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "sira-python"}
