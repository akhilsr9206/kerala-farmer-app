from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, CropLog, Badge

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# =========================
# SIMPLE ADMIN CHECK (TEMP)
# =========================
def require_admin(is_admin: bool = False):
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return True


# =========================
# GET ALL USERS
# =========================
@router.get("/users")
def get_users(
    db: Session = Depends(get_db),
    admin_check = Depends(require_admin)
):
    users = db.query(User).all()

    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "district": u.district,
            "land_size": u.land_size,
            "created_at": u.created_at,
            "total_crops": len(u.crops),
            "badges": len(u.badges)
        }
        for u in users
    ]


# =========================
# UPDATE USER
# =========================
@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin_check = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = data.get("name", user.name)
    user.email = data.get("email", user.email)
    user.district = data.get("district", user.district)
    user.land_size = data.get("land_size", user.land_size)

    db.commit()

    return {"message": "User updated successfully"}


# =========================
# DELETE USER
# =========================
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_check = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # delete related data
    db.query(CropLog).filter(CropLog.user_id == user_id).delete()
    db.query(Badge).filter(Badge.user_id == user_id).delete()

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}