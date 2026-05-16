from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from services.llm_service import (
    ask_llm_pest_text,
    ask_llm_common_pests,
    analyze_crop_image,
    detect_language
)

router = APIRouter()

@router.post("/analyze")
async def analyze_pest(
    crop_name: str = Form(...),
    symptoms:  str = Form(...),
    district:  str = Form(...),
    language:  str = Form("auto"),
    image: Optional[UploadFile] = File(None)
):
    # Auto-detect language
    if language == "auto":
        language = detect_language(symptoms or "")

    image_bytes    = None
    image_uploaded = False

    if image and image.filename and image.filename != '':
        try:
            image_bytes    = await image.read()
            image_uploaded = True
            print(f"📸 Image: {image.filename} ({len(image_bytes)} bytes)")
        except Exception as e:
            print(f"Image read error: {e}")

    if image_bytes and len(image_bytes) > 100:
        print("🔍 Analyzing with Groq Vision...")
        analysis = analyze_crop_image(
            image_bytes=image_bytes,
            crop_name=crop_name,
            district=district,
            symptoms=symptoms,
            language=language
        )
        method = "Groq Vision AI (Llama 4 Scout)"
    else:
        print("📝 Text-only analysis...")
        analysis = ask_llm_pest_text(
            crop=crop_name,
            district=district,
            symptoms=symptoms,
            language=language
        )
        method = "Text Analysis (KrishiBot)"

    return {
        "analysis":        analysis,
        "crop":            crop_name,
        "district":        district,
        "image_uploaded":  image_uploaded,
        "analysis_method": method,
        "language":        language
    }

@router.get("/common/{district}")
def common_pests(district: str, language: str = "english"):
    result = ask_llm_common_pests(district=district, language=language)
    return {"district": district, "common_pests": result}

@router.post("/quick-scan")
async def quick_scan(
    image:    UploadFile = File(...),
    language: str = Form("english")
):
    try:
        image_bytes = await image.read()
        analysis = analyze_crop_image(
            image_bytes=image_bytes,
            crop_name="Unknown",
            district="Kerala",
            symptoms="Quick scan — identify crop and disease",
            language=language
        )
        return {"quick_result": analysis, "image_filename": image.filename}
    except Exception as e:
        return {"quick_result": f"Error: {str(e)}", "image_filename": ""}