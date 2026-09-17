from fastapi import FastAPI, HTTPException

from models import EmailRequest
from ai import analyze_email


app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Ghost Writer API is running"
    }


@app.post("/api/analyze")
def analyze(request: EmailRequest):

    if not request.email.strip():
        raise HTTPException(
            status_code=400,
            detail="Email cannot be empty"
        )

    try:
        result = analyze_email(request.email)

        return {
            "email": request.email,
            "analysis": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )