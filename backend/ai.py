import os
import json

from dotenv import load_dotenv
from openai import OpenAI

from models import AnalysisResponse

load_dotenv()

api_key = os.getenv("NVIDIA_API_KEY")

if not api_key:
    raise RuntimeError("NVIDIA_API_KEY is missing from .env")

client = OpenAI(
    api_key=api_key,
    base_url="https://integrate.api.nvidia.com/v1"
)

SYSTEM_PROMPT = """
You are Ghost Writer, an AI email intelligence assistant.

Analyze the incoming email and return ONLY valid JSON.

Use exactly this structure:

{
  "intent": "string",
  "tone": "string",
  "context": "string",
  "requested_action": "string",
  "responses": [
    {
      "type": "Enthusiastic Yes",
      "description": "string",
      "text": "string"
    },
    {
      "type": "Professional Refusal",
      "description": "string",
      "text": "string"
    },
    {
      "type": "Negotiation",
      "description": "string",
      "text": "string"
    }
  ]
}

Rules:
- Generate exactly 3 responses.
- Use exactly these response types:
  Enthusiastic Yes
  Professional Refusal
  Negotiation
- Never invent names, dates, prices, times, locations,
  deadlines, availability, or commitments.
- Never invent a reason for accepting or refusing.
- If availability is unknown, ask for available times.
- Keep replies natural, concise, professional, and useful.
- Return ONLY JSON.
"""


def analyze_email(email: str):

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": email
            }
        ],
        temperature=0.2,
        max_tokens=2000,
        reasoning_effort="low"
    )

    choice = response.choices[0]

    # Some reasoning models may put useful output in
    # reasoning_content instead of message.content.
    content = choice.message.content

    if not content:
        reasoning = getattr(choice.message, "reasoning_content", None)

        if reasoning:
            content = reasoning

    if not content:
        raise RuntimeError(
            "NVIDIA returned an empty response. "
            f"Finish reason: {choice.finish_reason}"
        )

    # Remove accidental markdown JSON fences
    content = content.strip()

    if content.startswith("```"):
        content = content.replace("```json", "", 1)
        content = content.replace("```", "", 1)
        content = content.strip()

    try:
        data = json.loads(content)

        return AnalysisResponse(**data)

    except Exception as e:
        raise RuntimeError(
            f"AI returned invalid JSON: {e}\n\n"
            f"AI response:\n{content}"
        )