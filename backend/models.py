from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    learning_goal = Column(String, nullable=False)
    daily_time = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    learning_style = Column(String, nullable=False)
    target_level = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # İlişkiler
    learning_plans = relationship("LearningPlan", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user")

class LearningPlan(Base):
    __tablename__ = "learning_plans"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    plan_data = Column(JSON, nullable=False)  # Tüm plan verisini JSON olarak sakla
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # İlişkiler
    user = relationship("User", back_populates="learning_plans")
    modules = relationship("Module", back_populates="learning_plan")

class Module(Base):
    __tablename__ = "modules"
    
    id = Column(String, primary_key=True)
    learning_plan_id = Column(String, ForeignKey("learning_plans.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    objectives = Column(JSON)  # List of objectives
    resources = Column(JSON)   # List of resources
    quiz_data = Column(JSON)   # Quiz information
    module_type = Column(String, nullable=False)  # lesson, quiz, exam
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    learning_plan = relationship("LearningPlan", back_populates="modules")
    feedbacks = relationship("Feedback", back_populates="module")

class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    feedback_text = Column(Text, nullable=False)
    sentiment_score = Column(Integer, default=0)  # -1: negative, 0: neutral, 1: positive
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    user = relationship("User", back_populates="feedbacks")
    module = relationship("Module", back_populates="feedbacks")

class ApiUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    endpoint = Column(String, nullable=False)
    request_data = Column(JSON)
    response_data = Column(JSON)
    status_code = Column(Integer)
    processing_time = Column(Integer)  # milliseconds
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # İlişki  
    user = relationship("User") 