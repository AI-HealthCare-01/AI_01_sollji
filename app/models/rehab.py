from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, ForeignKey, Index
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ExerciseLibrary(Base):
    __tablename__ = "exercise_library"
    exercise_id = Column(String(50), primary_key=True)
    exercise_name = Column(String(100), nullable=False)
    category = Column(String(50))
    difficulty_level = Column(String(20))
    instructions = Column(Text)           # ✅ 추가
    contraindications = Column(ARRAY(String))  # ✅ 추가
    video_url = Column(String(1000))
    thumbnail_url = Column(String(1000))
    tags = Column(ARRAY(String))
    created_at = Column(TIMESTAMP, server_default=func.now())
    rehab_exercises = relationship("RehabExercise", back_populates="exercise")

class RehabPlan(Base):
    __tablename__ = "rehab_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    guide_result_id = Column(Integer, ForeignKey("guide_results.id", ondelete="CASCADE"), nullable=False)
    target_area = Column(String(50))
    duration_weeks = Column(Integer)
    precautions = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    guide_result = relationship("GuideResult", back_populates="rehab_plan")
    exercises = relationship("RehabExercise", back_populates="rehab_plan", cascade="all, delete-orphan")
    completions = relationship("ExerciseCompletion", back_populates="rehab_plan", cascade="all, delete-orphan")
    __table_args__ = (Index('idx_rehab_plans_user_active', 'user_id', 'is_active'),)

class RehabExercise(Base):
    __tablename__ = "rehab_exercises"
    id = Column(Integer, primary_key=True, index=True)
    rehab_plan_id = Column(Integer, ForeignKey("rehab_plans.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(String(50), ForeignKey("exercise_library.exercise_id"), nullable=False)
    week_number = Column(Integer)
    sequence_order = Column(Integer)
    sets = Column(Integer)
    reps = Column(Integer)
    duration_seconds = Column(Integer)
    frequency_per_day = Column(Integer)
    special_notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    rehab_plan = relationship("RehabPlan", back_populates="exercises")
    exercise = relationship("ExerciseLibrary", back_populates="rehab_exercises")
    completions = relationship("ExerciseCompletion", back_populates="rehab_exercise", cascade="all, delete-orphan")

class ExerciseCompletion(Base):
    __tablename__ = "exercise_completions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rehab_exercise_id = Column(Integer, ForeignKey("rehab_exercises.id", ondelete="CASCADE"), nullable=False)
    rehab_plan_id = Column(Integer, ForeignKey("rehab_plans.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(TIMESTAMP, server_default=func.now())
    actual_sets = Column(Integer)
    actual_reps = Column(Integer)
    pain_level = Column(Integer)
    notes = Column(Text)
    rehab_plan = relationship("RehabPlan", back_populates="completions")
    rehab_exercise = relationship("RehabExercise", back_populates="completions")
