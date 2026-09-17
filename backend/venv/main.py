from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Ghost Writer API is running"
    }