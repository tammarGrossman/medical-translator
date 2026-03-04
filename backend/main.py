from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
import fitz
import os
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_text_from_pdf(file_bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

@app.post("/translate")
async def translate(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text_from_pdf(content)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"""קרא את הטקסט הבא וענה בJSON בפורמט הזה בדיוק:

אם הטקסט אינו מאמר רפואי או מדעי:
{{
  "is_medical": false,
  "error": "הסבר קצר למה זה לא מאמר רפואי"
}}

אם הטקסט הוא מאמר רפואי או מדעי:
{{
  "is_medical": true,
  "doctor": {{
    "summary": "סיכום מקצועי קצר ומדויק",
    "findings": ["ממצא מפורט 1", "ממצא מפורט 2", "ממצא מפורט 3"],
    "keywords": ["מילת מפתח 1", "מילת מפתח 2", "מילת מפתח 3"],
    "stats": [
      {{"name": "שם מדד אמיתי מהמאמר", "value": 75}},
      {{"name": "שם מדד אמיתי מהמאמר", "value": 60}},
      {{"name": "שם מדד אמיתי מהמאמר", "value": 45}}
    ]
  }},
  "patient": {{
    "summary": "הסבר פשוט וברור למטופל ללא מונחים רפואיים",
    "symptoms": ["תסמין ברור 1", "תסמין ברור 2", "תסמין ברור 3"],
    "takeaway": "מסקנה אחת חשובה שהמטופל צריך לדעת",
    "risk_level": 65
  }},
  "child": {{
    "story": "סיפור יצירתי ומשעשע של 4-5 משפטים שמסביר את המחקר לילד עם אנלוגיות מהחיים",
    "emoji_summary": ["🦠", "💊", "🔬", "❤️", "✅"]
  }}
}}

הטקסט:
{text[:3000]}"""
        }],
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    
    if not result.get("is_medical"):
        raise HTTPException(status_code=400, detail=result.get("error", "זה לא מאמר רפואי"))
    
    return result