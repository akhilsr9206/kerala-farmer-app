from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import CropLog, Badge, User
from services.llm_service import ask_llm_dashboard_insights

router = APIRouter()

@router.get("/{user_id}")
def get_dashboard(user_id: int, db: Session = Depends(get_db)):
    user   = db.query(User).filter(User.id == user_id).first()
    logs   = db.query(CropLog).filter(CropLog.user_id == user_id).all()
    badges = db.query(Badge).filter(Badge.user_id == user_id).all()

    crop_summary = {}
    for log in logs:
        crop_summary[log.crop_name] = crop_summary.get(log.crop_name, 0) + log.area

    if logs:
        insights = ask_llm_dashboard_insights(
            name=user.name if user else "Farmer",
            district=user.district if user else "Kerala",
            crops=list(crop_summary.keys()),
            total_land=sum(crop_summary.values()),
            logs_count=len(logs),
            badges=len(badges)
        )
    else:
        insights = (
            "💡 Insight 1: Log your first crop to get personalized AI recommendations.\n"
            "💡 Insight 2: Visit your Krishi Bhavan for free soil testing this week.\n"
            "💡 Insight 3: Apply for PM-KISAN scheme — ₹6000/year direct benefit."
        )

    return {
        "total_crops_logged": len(logs),
        "crop_summary":       crop_summary,
        "badges_earned":      len(badges),
        "ai_insights":        insights,
        "recent_logs": [
            {"crop": l.crop_name, "area": l.area, "season": l.season}
            for l in logs[-3:]
        ]
    }