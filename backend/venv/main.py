from fastapi import FastAPI, HTTPException

from models import EmailRequest, AnalysisResponse
from ai import analyze_email


app = FastAPI(
    title="Ghost Writer API",
    description="AI-powered email intelligence and reply generator",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Ghost Writer API is running"
    }


@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze(request: EmailRequest):

    if not request.email.strip():
        raise HTTPException(
            status_code=400,
            detail="Email cannot be empty"
        )

    try:
        return analyze_email(request.email)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )