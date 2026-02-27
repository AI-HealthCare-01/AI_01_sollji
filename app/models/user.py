from sqlalchemy import Column, Integer, String, Date, CHAR, TIMESTAMP, ForeignKey, Boolean, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    birth_date = Column(Date)
    gender = Column(CHAR(1))
    phone = Column(String(20))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    chronic_conditions = relationship("ChronicCondition", back_populates="user", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="user", cascade="all, delete-orphan")
    health_profile = relationship("HealthProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    guide_results = relationship("GuideResult", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")

class HealthProfile(Base):
    __tablename__ = "health_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    height = Column(String(10))
    weight = Column(String(10))
    blood_type = Column(String(5))
    smoking_status = Column(String(20))
    alcohol_frequency = Column(String(20))
    exercise_frequency = Column(String(20))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="health_profile")

class ChronicCondition(Base):
    __tablename__ = "chronic_conditions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    condition_type = Column(String(50), nullable=False)
    diagnosed_date = Column(Date)
    severity = Column(String(20))
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    user = relationship("User", back_populates="chronic_conditions")

class Medication(Base):
    __tablename__ = "medications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    medication_name = Column(String(200), nullable=False)
    standardized_name = Column(String(200), index=True)
    ingredient = Column(String(200))
    dosage = Column(String(50), nullable=False)
    frequency = Column(Integer, nullable=False)
    timing = Column(JSONB, nullable=False)
    medication_type = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    user = relationship("User", back_populates="medications")

class Allergy(Base):
    __tablename__ = "allergies"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    allergen_name = Column(String(200), nullable=False)
    allergen_type = Column(String(50))
    severity = Column(String(20))
    reaction_description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    user = relationship("User", back_populates="allergies")
