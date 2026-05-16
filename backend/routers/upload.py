from fastapi import APIRouter, UploadFile, File
from services.rag_service import rebuild_vectorstore
import os
import shutil

router = APIRouter()

PDF_FOLDER = "data/pdfs"

@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return {"error": "Only PDF files allowed"}
    
    os.makedirs(PDF_FOLDER, exist_ok=True)
    file_path = os.path.join(PDF_FOLDER, file.filename)
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Rebuild vectorstore with new PDF
    print(f"📄 New PDF uploaded: {file.filename}")
    rebuild_vectorstore()
    
    return {
        "message": f"PDF '{file.filename}' uploaded and vectorstore rebuilt successfully!",
        "filename": file.filename
    }

@router.get("/pdfs")
def list_pdfs():
    os.makedirs(PDF_FOLDER, exist_ok=True)
    files = [f for f in os.listdir(PDF_FOLDER) if f.endswith('.pdf')]
    return {"pdfs": files, "count": len(files)}