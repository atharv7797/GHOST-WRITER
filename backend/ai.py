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

Analyze the incoming email.

Return ONLY valid JSON.

The JSON must contain exactly these fields:

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

IMPORTANT RULES:

- Generate exactly 3 responses.
- The response types must be exactly:
  1. Enthusiastic Yes
  2. Professional Refusal
  3. Negotiation
- Never invent facts.
- Never invent dates, times, prices, names, companies,
  availability, deadlines, locations, or commitments.
- NEVER claim that the recipient is busy, unavailable,
  fully booked, available, interested, or has limited
  availability unless the incoming email explicitly provides
  that information.
- NEVER create a reason for accepting or refusing an email.
- If availability is unknown, ask the sender for their
  available times instead.
- A refusal must not invent a reason.
- A negotiation must not invent constraints.
- If information is missing, ask the sender for it.
- Do not claim that the user is available at a particular time.
- Do not claim that the user has accepted anything.
- Replies should be natural and professional.
- Keep each reply useful and context-aware.
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
        temperature=0.4,
        max_tokens=2000
    )

    raw_response = response.choices[0].message.content

    try:
        data = json.loads(raw_response)
        return AnalysisResponse(**data)

    except Exception as e:
        raise RuntimeError(
            f"AI returned invalid JSON: {e}\n\nAI response:\n{raw_response}"
        )