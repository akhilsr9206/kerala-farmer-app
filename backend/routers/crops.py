from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.user import CropLog
from services.llm_service import ask_llm_crop_plan, ask_llm_crop_goals

router = APIRouter()

class CropLogRequest(BaseModel):
    user_id: int
    crop_name: str
    soil_type: str
    area: float
    season: str
    district: str
    rainfall: float = 0
    fertilizer: str = ""
    notes: str = ""

class CropPlanRequest(BaseModel):
    user_id: int
    crop_name: str
    soil_type: str
    area: float
    season: str
    district: str
    rainfall: float = 2000
    fertilizer: str = "Kharif"
    notes: str = ""
    irrigation: str = "drip"
    fertilizer_kg: float = 50.0
    pesticide_kg: float = 2.0
    farming_experience: int = 5

@router.post("/log")
def log_crop(req: CropLogRequest, db: Session = Depends(get_db)):
    log = CropLog(
        user_id=req.user_id,
        crop_name=req.crop_name,
        soil_type=req.soil_type,
        area=req.area,
        season=req.season,
        district=req.district,
        rainfall=req.rainfall,
        fertilizer=req.fertilizer,
        notes=req.notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    goals = ask_llm_crop_goals(
        crop=req.crop_name,
        soil=req.soil_type,
        area=req.area,
        season=req.season,
        district=req.district,
        rainfall=req.rainfall
    )
    return {"log_id": log.id, "goals": goals}

@router.get("/logs/{user_id}")
def get_logs(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(CropLog).filter(CropLog.user_id == user_id).all()
    return logs

@router.post("/plan")
def generate_crop_plan(req: CropPlanRequest):
    plan = ask_llm_crop_plan(
        crop=req.crop_name,
        district=req.district,
        soil=req.soil_type,
        area=req.area,
        season=req.season,
        rainfall=req.rainfall,
        irrigation=req.irrigation,
        fertilizer_kg=req.fertilizer_kg,
        experience=req.farming_experience,
        notes=req.notes
    )
    return {"crop_plan": plan}