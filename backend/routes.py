from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, LearningPlan, Module, Feedback, ApiUsage
from gemini_service import GeminiService
from main import UserData, FeedbackData, RegenerateRequest, LearningPlan as LearningPlanResponse
import json
import logging
from datetime import datetime
from typing import List
import time

logger = logging.getLogger(__name__)

# Router oluştur
router = APIRouter()

# Gemini servisini başlat
gemini_service = GeminiService()

@router.post("/api/generate-plan", response_model=LearningPlanResponse)
async def generate_plan(user_data: UserData, db: Session = Depends(get_db)):
    """Kullanıcı verilerine göre öğrenme planı oluştur"""
    start_time = time.time()
    
    try:
        logger.info(f"Plan oluşturma isteği alındı: {user_data.learningGoal}")
        
        # Kullanıcı verilerini veritabanına kaydet
        user = User(
            learning_goal=user_data.learningGoal,
            daily_time=user_data.dailyTime,
            duration=user_data.duration,
            learning_style=user_data.learningStyle,
            target_level=user_data.targetLevel
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Gemini ile plan oluştur
        user_data_dict = {
            "learningGoal": user_data.learningGoal,
            "dailyTime": user_data.dailyTime,
            "duration": user_data.duration,
            "learningStyle": user_data.learningStyle,
            "targetLevel": user_data.targetLevel
        }
        
        plan_data = await gemini_service.generate_learning_plan(user_data_dict)
        
        # Planı veritabanına kaydet
        learning_plan = LearningPlan(
            user_id=user.id,
            title=plan_data["title"],
            plan_data=plan_data
        )
        db.add(learning_plan)
        db.commit()
        db.refresh(learning_plan)
        
        # Modülleri veritabanına kaydet
        for module_data in plan_data["modules"]:
            module = Module(
                id=f"{learning_plan.id}_{module_data['id']}",
                learning_plan_id=learning_plan.id,
                title=module_data["title"],
                description=module_data["description"],
                objectives=module_data["objectives"],
                resources=module_data["resources"],
                quiz_data=module_data["quiz"],
                module_type=module_data["type"]
            )
            db.add(module)
        
        db.commit()
        
        # API kullanım istatistiklerini kaydet
        processing_time = int((time.time() - start_time) * 1000)
        api_usage = ApiUsage(
            user_id=user.id,
            endpoint="/api/generate-plan",
            request_data=user_data_dict,
            response_data=plan_data,
            status_code=200,
            processing_time=processing_time
        )
        db.add(api_usage)
        db.commit()
        
        logger.info(f"Plan başarıyla oluşturuldu. İşlem süresi: {processing_time}ms")
        
        return plan_data
        
    except Exception as e:
        logger.error(f"Plan oluşturma hatası: {str(e)}")
        db.rollback()
        
        # Hata durumunda da istatistik kaydet
        processing_time = int((time.time() - start_time) * 1000)
        try:
            api_usage = ApiUsage(
                endpoint="/api/generate-plan",
                request_data=user_data_dict if 'user_data_dict' in locals() else {},
                status_code=500,
                processing_time=processing_time
            )
            db.add(api_usage)
            db.commit()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Plan oluşturulamadı: {str(e)}")

@router.post("/api/regenerate-plan", response_model=LearningPlanResponse)
async def regenerate_plan(request: RegenerateRequest, db: Session = Depends(get_db)):
    """Geri bildirimlere göre planı yeniden oluştur"""
    start_time = time.time()
    
    try:
        logger.info(f"Plan yenileme isteği alındı: {request.userData.learningGoal}")
        
        # Kullanıcının mevcut planını bul
        user = db.query(User).filter(
            User.learning_goal == request.userData.learningGoal
        ).first()
        
        if user:
            # Mevcut aktif planları pasif yap
            db.query(LearningPlan).filter(
                LearningPlan.user_id == user.id,
                LearningPlan.is_active == True
            ).update({"is_active": False})
            
            # Kullanıcı verilerini güncelle
            user.daily_time = request.userData.dailyTime
            user.duration = request.userData.duration
            user.learning_style = request.userData.learningStyle
            user.target_level = request.userData.targetLevel
            user.updated_at = datetime.now()
        else:
            # Yeni kullanıcı oluştur
            user = User(
                learning_goal=request.userData.learningGoal,
                daily_time=request.userData.dailyTime,
                duration=request.userData.duration,
                learning_style=request.userData.learningStyle,
                target_level=request.userData.targetLevel
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        # Geri bildirimleri veritabanına kaydet
        for feedback_data in request.feedbacks:
            feedback = Feedback(
                user_id=user.id,
                module_id=feedback_data.moduleId,
                feedback_text=feedback_data.feedback
            )
            db.add(feedback)
        
        db.commit()
        
        # Gemini ile yeni plan oluştur
        user_data_dict = {
            "learningGoal": request.userData.learningGoal,
            "dailyTime": request.userData.dailyTime,
            "duration": request.userData.duration,
            "learningStyle": request.userData.learningStyle,
            "targetLevel": request.userData.targetLevel
        }
        
        feedbacks_dict = [
            {
                "moduleId": f.moduleId,
                "feedback": f.feedback
            } for f in request.feedbacks
        ]
        
        plan_data = await gemini_service.regenerate_plan(
            user_data_dict,
            feedbacks_dict,
            request.completedModules
        )
        
        # Yeni planı kaydet
        learning_plan = LearningPlan(
            user_id=user.id,
            title=plan_data["title"],
            plan_data=plan_data,
            is_active=True
        )
        db.add(learning_plan)
        db.commit()
        db.refresh(learning_plan)
        
        # Yeni modülleri kaydet
        for module_data in plan_data["modules"]:
            module = Module(
                id=f"{learning_plan.id}_{module_data['id']}",
                learning_plan_id=learning_plan.id,
                title=module_data["title"],
                description=module_data["description"],
                objectives=module_data["objectives"],
                resources=module_data["resources"],
                quiz_data=module_data["quiz"],
                module_type=module_data["type"]
            )
            db.add(module)
        
        db.commit()
        
        # API kullanım istatistiklerini kaydet
        processing_time = int((time.time() - start_time) * 1000)
        api_usage = ApiUsage(
            user_id=user.id,
            endpoint="/api/regenerate-plan",
            request_data={
                "userData": user_data_dict,
                "feedbacksCount": len(request.feedbacks),
                "completedModulesCount": len(request.completedModules)
            },
            response_data=plan_data,
            status_code=200,
            processing_time=processing_time
        )
        db.add(api_usage)
        db.commit()
        
        logger.info(f"Plan başarıyla yenilendi. İşlem süresi: {processing_time}ms")
        
        return plan_data
        
    except Exception as e:
        logger.error(f"Plan yenileme hatası: {str(e)}")
        db.rollback()
        
        # Hata durumunda da istatistik kaydet
        processing_time = int((time.time() - start_time) * 1000)
        try:
            api_usage = ApiUsage(
                endpoint="/api/regenerate-plan",
                status_code=500,
                processing_time=processing_time
            )
            db.add(api_usage)
            db.commit()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Plan yenilenemedi: {str(e)}")

@router.post("/api/save-feedback")
async def save_feedback(feedback_data: FeedbackData, db: Session = Depends(get_db)):
    """Kullanıcı geri bildirimini kaydet"""
    start_time = time.time()
    
    try:
        logger.info(f"Geri bildirim kaydı alındı - Modül: {feedback_data.moduleId}")
        
        # Basit sentiment analizi (gelecekte ML model kullanılabilir)
        sentiment_score = 0
        feedback_lower = feedback_data.feedback.lower()
        
        positive_words = ["iyi", "güzel", "başarılı", "mükemmel", "harika", "faydalı", "kolay"]
        negative_words = ["zor", "kötü", "anlamadım", "karmaşık", "eksik", "yetersiz"]
        
        positive_count = sum(1 for word in positive_words if word in feedback_lower)
        negative_count = sum(1 for word in negative_words if word in feedback_lower)
        
        if positive_count > negative_count:
            sentiment_score = 1
        elif negative_count > positive_count:
            sentiment_score = -1
        
        # Geri bildirimi kaydet
        feedback = Feedback(
            user_id=feedback_data.userId if feedback_data.userId else "anonymous",
            module_id=feedback_data.moduleId,
            feedback_text=feedback_data.feedback,
            sentiment_score=sentiment_score
        )
        
        db.add(feedback)
        db.commit()
        
        # API kullanım istatistiklerini kaydet
        processing_time = int((time.time() - start_time) * 1000)
        api_usage = ApiUsage(
            user_id=feedback_data.userId,
            endpoint="/api/save-feedback",
            request_data={
                "moduleId": feedback_data.moduleId,
                "feedbackLength": len(feedback_data.feedback),
                "sentimentScore": sentiment_score
            },
            status_code=200,
            processing_time=processing_time
        )
        db.add(api_usage)
        db.commit()
        
        logger.info(f"Geri bildirim başarıyla kaydedildi. Sentiment: {sentiment_score}")
        
        return {
            "success": True,
            "message": "Geri bildirim başarıyla kaydedildi",
            "sentimentScore": sentiment_score
        }
        
    except Exception as e:
        logger.error(f"Geri bildirim kaydetme hatası: {str(e)}")
        db.rollback()
        
        # Hata durumunda da istatistik kaydet
        processing_time = int((time.time() - start_time) * 1000)
        try:
            api_usage = ApiUsage(
                endpoint="/api/save-feedback",
                status_code=500,
                processing_time=processing_time
            )
            db.add(api_usage)
            db.commit()
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Geri bildirim kaydedilemedi: {str(e)}")

@router.get("/api/user-stats/{user_id}")
async def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    """Kullanıcı istatistiklerini getir"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        # İstatistikleri hesapla
        total_plans = db.query(LearningPlan).filter(LearningPlan.user_id == user_id).count()
        completed_modules = db.query(Module).filter(
            Module.learning_plan_id.in_(
                db.query(LearningPlan.id).filter(LearningPlan.user_id == user_id)
            ),
            Module.is_completed == True
        ).count()
        total_feedbacks = db.query(Feedback).filter(Feedback.user_id == user_id).count()
        
        return {
            "userId": user_id,
            "learningGoal": user.learning_goal,
            "totalPlans": total_plans,
            "completedModules": completed_modules,
            "totalFeedbacks": total_feedbacks,
            "joinDate": user.created_at.isoformat(),
            "lastActivity": user.updated_at.isoformat() if user.updated_at else user.created_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Kullanıcı istatistik hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"İstatistikler alınamadı: {str(e)}")

@router.get("/api/analytics")
async def get_analytics(db: Session = Depends(get_db)):
    """Genel analitik verilerini getir"""
    try:
        total_users = db.query(User).count()
        total_plans = db.query(LearningPlan).count()
        total_modules = db.query(Module).count()
        completed_modules = db.query(Module).filter(Module.is_completed == True).count()
        total_feedbacks = db.query(Feedback).count()
        
        # Sentiment analizi
        positive_feedbacks = db.query(Feedback).filter(Feedback.sentiment_score == 1).count()
        negative_feedbacks = db.query(Feedback).filter(Feedback.sentiment_score == -1).count()
        neutral_feedbacks = db.query(Feedback).filter(Feedback.sentiment_score == 0).count()
        
        return {
            "totalUsers": total_users,
            "totalPlans": total_plans,
            "totalModules": total_modules,
            "completedModules": completed_modules,
            "completionRate": round((completed_modules / total_modules * 100) if total_modules > 0 else 0, 2),
            "totalFeedbacks": total_feedbacks,
            "sentimentAnalysis": {
                "positive": positive_feedbacks,
                "negative": negative_feedbacks,
                "neutral": neutral_feedbacks
            }
        }
        
    except Exception as e:
        logger.error(f"Analitik hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analitik veriler alınamadı: {str(e)}") 