import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY is missing from .env")

client = OpenAI(api_key=api_key)


def analyze_email(email: str):

    response = client.responses.create(
        model="gpt-5.6-luna",
        input=[
            {
                "role": "system",
                "content": """
You are Ghost Writer, an AI email intelligence assistant.

Analyze the incoming email and provide:

1. Intent
2. Tone
3. Context
4. Requested Action

Then generate exactly three possible replies:

1. Enthusiastic Yes
2. Professional Refusal
3. Negotiation

Make every reply relevant to the incoming email.
Keep replies natural, clear, and professional.
Do not invent information that is not present in the email.
"""
            },
            {
                "role": "user",
                "content": email
            }
        ]
    )

    return response.output_text