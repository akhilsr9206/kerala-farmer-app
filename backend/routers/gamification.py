from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.user import Badge, CropLog

router = APIRouter()

BADGE_RULES = [
    {"name": "First Harvest", "description": "Logged your first crop!", "min_logs": 1},
    {"name": "Green Farmer", "description": "Logged 5 crops!", "min_logs": 5},
    {"name": "Kerala Champion", "description": "Logged 10 crops!", "min_logs": 10},
    {"name": "Sustainable Hero", "description": "Used organic methods!", "min_logs": 3},
]

class BadgeCheckRequest(BaseModel):
    user_id: int

@router.post("/check-badges")
def check_badges(req: BadgeCheckRequest, db: Session = Depends(get_db)):
    logs_count = db.query(CropLog).filter(CropLog.user_id == req.user_id).count()
    existing = [b.badge_name for b in db.query(Badge).filter(Badge.user_id == req.user_id).all()]
    
    new_badges = []
    for rule in BADGE_RULES:
        if rule["name"] not in existing and logs_count >= rule["min_logs"]:
            badge = Badge(
                user_id=req.user_id,
                badge_name=rule["name"],
                description=rule["description"]
            )
            db.add(badge)
            new_badges.append(rule["name"])
    
    db.commit()
    return {"new_badges": new_badges, "total_logs": logs_count}

@router.get("/badges/{user_id}")
def get_badges(user_id: int, db: Session = Depends(get_db)):
    badges = db.query(Badge).filter(Badge.user_id == user_id).all()
    return {"badges": [{"name": b.badge_name, "description": b.description} for b in badges]}