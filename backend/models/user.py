from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    district = Column(String)
    land_size = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_admin = Column(Boolean, default=False)
    crops = relationship("CropLog", back_populates="owner")
    badges = relationship("Badge", back_populates="owner")

class CropLog(Base):
    __tablename__ = "crop_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    crop_name = Column(String)
    soil_type = Column(String)
    area = Column(Float)
    season = Column(String)
    district = Column(String)
    rainfall = Column(Float)
    fertilizer = Column(String)
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="crops")

class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_name = Column(String)
    description = Column(String)
    earned_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="badges")