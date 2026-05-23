from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/example")
def get_example():
    return {
        "message": "Hello from the SIRA Python API",
        "data": {
            "id": 1,
            "name": "example",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    }
