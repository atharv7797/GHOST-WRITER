from pydantic import BaseModel


class EmailRequest(BaseModel):
    email: str


class ResponseChoice(BaseModel):
    type: str
    description: str
    text: str


class AnalysisResponse(BaseModel):
    intent: str
    tone: str
    context: str
    requested_action: str
    responses: list[ResponseChoice]