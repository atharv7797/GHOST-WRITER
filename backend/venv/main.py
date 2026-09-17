from fastapi import FastAPI
from models import EmailRequest

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Ghost Writer API is running"
    }


@app.post("/api/analyze")
def analyze_email(request: EmailRequest):
    return {
        "message": "Email received successfully",
        "email": request.email
    }