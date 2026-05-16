from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import ask_llm_with_context, detect_language
from services.rag_service import retrieve_context

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    language: str = "auto"

@router.post("/chat")
def chat(req: ChatRequest):
    try:
        # Auto-detect language
        language = req.language
        if language == "auto" or not language:
            language = detect_language(req.message)

        context  = retrieve_context(req.message, k=4)
        response = ask_llm_with_context(req.message, context, language)
        return {
            "response": response,
            "language": language,
            "context_used": len(context) > 50
        }
    except Exception as e:
        print("❌ Chatbot error:", e)
        return {"response": f"Error: {str(e)}", "language": req.language}