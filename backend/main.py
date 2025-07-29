from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from datetime import datetime
import json
import logging

# Logging konfigürasyonu
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app oluştur
app = FastAPI(
    title="SkillMatch AI Backend",
    description="Kişiselleştirilmiş Mikro Eğitim Asistanı Backend API",
    version="1.0.0"
)

# CORS middleware ekle - Frontend ile bağlantı için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic modelleri
class UserData(BaseModel):
    learningGoal: str
    dailyTime: str
    duration: str
    learningStyle: str
    targetLevel: str

class QuizData(BaseModel):
    question: str
    type: str
    options: Optional[List[str]] = None

class ModuleData(BaseModel):
    id: str
    title: str
    description: str
    objectives: List[str]
    resources: List[str]
    quiz: QuizData
    type: str

class LearningPlan(BaseModel):
    title: str
    modules: List[ModuleData]

class FeedbackData(BaseModel):
    moduleId: str
    feedback: str
    userId: Optional[str] = None
    timestamp: str

class RegenerateRequest(BaseModel):
    userData: UserData
    feedbacks: List[FeedbackData]
    completedModules: List[str]

# Routes'ları dahil et
from routes import router
app.include_router(router)

# Database bağlantısını yönet
from database import connect_db, disconnect_db, Base, engine

@app.on_event("startup")
async def startup():
    """Uygulama başlatıldığında çalışır"""
    # Veritabanı tablolarını oluştur
    Base.metadata.create_all(bind=engine)
    # Database bağlantısını başlat
    await connect_db()
    logger.info("Backend başarıyla başlatıldı!")

@app.on_event("shutdown")
async def shutdown():
    """Uygulama kapatıldığında çalışır"""
    await disconnect_db()
    logger.info("Backend kapatıldı.")

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "SkillMatch AI Backend çalışıyor!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 