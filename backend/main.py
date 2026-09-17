from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import EmailRequest, AnalysisResponse
from ai import analyze_email


app = FastAPI(
    title="Ghost Writer API",
    description="AI-powered email intelligence and reply generator",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://atharv7797.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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