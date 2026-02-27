from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class GuideResult(Base):
    __tablename__ = "guide_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ocr_result_id = Column(Integer, ForeignKey("ocr_results.id"), nullable=False)
    status = Column(String(20), default="processing", nullable=False, server_default="processing")  # ← 추가
    error_message = Column(Text, nullable=True)  # ← 추가 (실패시 에러 저장용)
    overall_safety_score = Column(Integer)
    summary = Column(Text)
    medication_guide = Column(Text)
    lifestyle_guide = Column(Text)
    warning_signs = Column(Text)
    generated_at = Column(TIMESTAMP, server_default=func.now())
    user = relationship("User", back_populates="guide_results")
    drug_interactions = relationship("DrugInteraction", back_populates="guide_result", cascade="all, delete-orphan")
    medication_schedules = relationship("MedicationSchedule", back_populates="guide_result", cascade="all, delete-orphan")
    rehab_plan = relationship("RehabPlan", back_populates="guide_result", uselist=False, cascade="all, delete-orphan")

class DrugInteraction(Base):
    __tablename__ = "drug_interactions"
    id = Column(Integer, primary_key=True, index=True)
    guide_result_id = Column(Integer, ForeignKey("guide_results.id", ondelete="CASCADE"), nullable=False)
    medication_a = Column(String(200))
    medication_b = Column(String(200))
    interaction_type = Column(String(100))
    severity = Column(String(20))
    mechanism = Column(Text)
    recommendation = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    guide_result = relationship("GuideResult", back_populates="drug_interactions")

class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"
    id = Column(Integer, primary_key=True, index=True)
    guide_result_id = Column(Integer, ForeignKey("guide_results.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    schedule_date = Column(JSONB, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    guide_result = relationship("GuideResult", back_populates="medication_schedules")
