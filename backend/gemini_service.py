import google.generativeai as genai
import json
import re
import os
from typing import Dict, Any, List
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            logger.warning("Gemini API key bulunamadı. Fallback planlar kullanılacak.")
            self.model = None
    
    def _clean_json_response(self, response_text: str) -> str:
        """Gemini yanıtından JSON'u temizle ve düzelt"""
        try:
            # Markdown kod bloklarını temizle
            response_text = re.sub(r'```json\s*', '', response_text)
            response_text = re.sub(r'```\s*$', '', response_text)
            
            # Gereksiz açıklamaları ve metinleri temizle
            lines = response_text.split('\n')
            json_started = False
            json_lines = []
            
            for line in lines:
                stripped = line.strip()
                if stripped.startswith('{') or json_started:
                    json_started = True
                    json_lines.append(line)
                    if stripped.endswith('}') and len([c for c in ''.join(json_lines) if c == '{']) == len([c for c in ''.join(json_lines) if c == '}']):
                        break
            
            clean_text = '\n'.join(json_lines)
            
            # Yaygın JSON hatalarını düzelt
            clean_text = re.sub(r',\s*}', '}', clean_text)  # Trailing commas
            clean_text = re.sub(r',\s*]', ']', clean_text)   # Trailing commas in arrays
            
            return clean_text.strip()
        except Exception as e:
            logger.error(f"JSON temizleme hatası: {e}")
            return response_text
    
    def _parse_json_safely(self, text: str) -> Dict[Any, Any]:
        """JSON'u güvenli şekilde parse et"""
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse hatası: {e}")
            # Basit JSON onarım denemeleri
            try:
                # Eksik tırnak işaretlerini düzelt
                fixed_text = re.sub(r'(\w+):', r'"\1":', text)
                return json.loads(fixed_text)
            except:
                logger.error("JSON onarım başarısız")
                raise e
    
    async def generate_learning_plan(self, user_data: Dict[str, str]) -> Dict[str, Any]:
        """Kullanıcı verilerine göre öğrenme planı oluştur"""
        if not self.model:
            return self._create_fallback_plan(user_data)
        
        try:
            # Modül sayısını belirle
            module_count = self._get_module_count(user_data["duration"])
            
            # Türkçe prompt oluştur
            prompt = f"""
{user_data["learningGoal"]} konusunda kişiselleştirilmiş bir öğrenme planı oluştur.

Kullanıcı Bilgileri:
- Hedef: {user_data["learningGoal"]}
- Günlük Zaman: {user_data["dailyTime"]}
- Süre: {user_data["duration"]}
- Öğrenme Tarzı: {user_data["learningStyle"]}
- Hedef Seviye: {user_data["targetLevel"]}

Lütfen SADECE aşağıdaki JSON formatında {module_count} modül içeren bir plan döndür:

{{
  "title": "Plan Başlığı",
  "modules": [
    {{
      "id": "1",
      "title": "Modül Başlığı",
      "description": "Modül açıklaması",
      "objectives": ["Hedef 1", "Hedef 2"],
      "resources": ["Kaynak 1", "Kaynak 2"],
      "quiz": {{
        "question": "Değerlendirme sorusu?",
        "type": "open"
      }},
      "type": "lesson"
    }}
  ]
}}

Her 3. modülü "quiz" tipi, son modülü "exam" tipi yap. Diğer modüller "lesson" tipi olsun.
Türkçe içerik oluştur ve {module_count} modül ekle.
"""
            
            response = self.model.generate_content(prompt)
            clean_response = self._clean_json_response(response.text)
            plan_data = self._parse_json_safely(clean_response)
            
            # Plan yapısını doğrula ve düzelt
            validated_plan = self._validate_and_fix_plan(plan_data, module_count)
            
            logger.info("Gemini ile başarıyla plan oluşturuldu")
            return validated_plan
            
        except Exception as e:
            logger.error(f"Gemini plan oluşturma hatası: {e}")
            return self._create_fallback_plan(user_data)
    
    async def regenerate_plan(self, user_data: Dict[str, str], feedbacks: List[Dict], completed_modules: List[str]) -> Dict[str, Any]:
        """Geri bildirimlere göre planı yeniden oluştur"""
        if not self.model:
            return self._create_regenerated_fallback_plan(user_data)
        
        try:
            # Geri bildirimleri özetle
            feedback_summary = self._summarize_feedbacks(feedbacks)
            
            prompt = f"""
{user_data["learningGoal"]} konusundaki öğrenme planını geri bildirimlere göre güncelle.

Kullanıcı Geri Bildirimleri:
{feedback_summary}

Tamamlanan Modüller: {', '.join(completed_modules[:5])}

Lütfen bu geri bildirimleri dikkate alarak 5-7 modüllük güncellenmiş bir plan oluştur.
SADECE JSON formatında döndür:

{{
  "title": "Güncellenmiş Öğrenme Planı",
  "modules": [
    {{
      "id": "1",
      "title": "Modül Başlığı",
      "description": "Açıklama",
      "objectives": ["Hedef 1", "Hedef 2"],
      "resources": ["Kaynak 1", "Kaynak 2"],
      "quiz": {{
        "question": "Soru?",
        "type": "open"
      }},
      "type": "lesson"
    }}
  ]
}}
"""
            
            response = self.model.generate_content(prompt)
            clean_response = self._clean_json_response(response.text)
            plan_data = self._parse_json_safely(clean_response)
            
            validated_plan = self._validate_and_fix_plan(plan_data, 6)
            
            logger.info("Plan başarıyla yeniden oluşturuldu")
            return validated_plan
            
        except Exception as e:
            logger.error(f"Plan yenileme hatası: {e}")
            return self._create_regenerated_fallback_plan(user_data)
    
    def _get_module_count(self, duration: str) -> int:
        """Süreye göre modül sayısını belirle"""
        duration_map = {
            "2weeks": 5,
            "4weeks": 7,
            "8weeks": 10,
            "12weeks": 12
        }
        return duration_map.get(duration, 7)
    
    def _summarize_feedbacks(self, feedbacks: List[Dict]) -> str:
        """Geri bildirimleri özetle"""
        if not feedbacks:
            return "Henüz geri bildirim yok"
        
        summary_parts = []
        for feedback in feedbacks[:3]:  # İlk 3 geri bildirimi al
            module_id = feedback.get("moduleId", "Bilinmeyen")
            text = feedback.get("feedback", "")[:80]  # İlk 80 karakter
            summary_parts.append(f"Modül {module_id}: {text}")
        
        return "; ".join(summary_parts)
    
    def _validate_and_fix_plan(self, plan_data: Dict[str, Any], expected_modules: int) -> Dict[str, Any]:
        """Plan yapısını doğrula ve eksiklikleri düzelt"""
        if not plan_data.get("title"):
            plan_data["title"] = "Kişiselleştirilmiş Öğrenme Planı"
        
        if not isinstance(plan_data.get("modules"), list):
            plan_data["modules"] = []
        
        # Modülleri doğrula
        for i, module in enumerate(plan_data["modules"]):
            if not module.get("id"):
                module["id"] = str(i + 1)
            if not module.get("title"):
                module["title"] = f"Modül {i + 1}"
            if not module.get("description"):
                module["description"] = "Öğrenme modülü açıklaması"
            if not isinstance(module.get("objectives"), list):
                module["objectives"] = ["Öğrenme hedefi"]
            if not isinstance(module.get("resources"), list):
                module["resources"] = ["Öğrenme materyali"]
            if not module.get("quiz"):
                module["quiz"] = {"question": "Bu modülde ne öğrendin?", "type": "open"}
            if not module.get("type"):
                # Her 3. modül quiz, son modül exam
                if (i + 1) % 3 == 0 and i < len(plan_data["modules"]) - 1:
                    module["type"] = "quiz"
                elif i == len(plan_data["modules"]) - 1:
                    module["type"] = "exam" 
                else:
                    module["type"] = "lesson"
        
        return plan_data
    
    def _create_fallback_plan(self, user_data: Dict[str, str]) -> Dict[str, Any]:
        """API mevcut değilken kullanılacak fallback planı"""
        module_count = self._get_module_count(user_data["duration"])
        
        modules = []
        for i in range(module_count):
            module_type = "lesson"
            if (i + 1) % 3 == 0 and i < module_count - 1:
                module_type = "quiz"
            elif i == module_count - 1:
                module_type = "exam"
            
            modules.append({
                "id": str(i + 1),
                "title": f"{user_data['learningGoal']} - Modül {i + 1}",
                "description": f"Bu modülde {user_data['learningGoal']} konusunda temel bilgileri öğreneceksiniz.",
                "objectives": [
                    f"{user_data['learningGoal']} temel kavramları",
                    "Pratik uygulamalar"
                ],
                "resources": [
                    "Interaktif öğrenme materyalleri",
                    "Video eğitimler",
                    "Uygulamalı örnekler"
                ],
                "quiz": {
                    "question": f"Bu modülde {user_data['learningGoal']} hakkında en çok hangi konuyu öğrendiniz?",
                    "type": "open"
                },
                "type": module_type
            })
        
        return {
            "title": f"{user_data['learningGoal']} Öğrenme Planı",
            "modules": modules
        }
    
    def _create_regenerated_fallback_plan(self, user_data: Dict[str, str]) -> Dict[str, Any]:
        """Yeniden oluşturma için fallback planı"""
        return {
            "title": "Güncellenmiş Öğrenme Planı",
            "modules": [
                {
                    "id": "1",
                    "title": "Yeniden Başlangıç",
                    "description": "Geri bildirimleriniz doğrultusunda optimize edilmiş içerik",
                    "objectives": ["Geliştirilmiş öğrenme deneyimi", "Kişiselleştirilmiş yaklaşım"],
                    "resources": ["Güncellenmiş materyaller", "İyileştirilmiş alıştırmalar"],
                    "quiz": {"question": "Bu yeni yaklaşım nasıl?", "type": "open"},
                    "type": "lesson"
                },
                {
                    "id": "2",
                    "title": "Gelişmiş Konular",
                    "description": "Daha derinlemesine ve pratik odaklı içerik",
                    "objectives": ["İleri seviye beceriler", "Gerçek dünya uygulamaları"],
                    "resources": ["Pratik projeler", "Gerçek örnekler"],
                    "quiz": {
                        "question": "Hangi konu daha faydalı?",
                        "options": ["Teori", "Pratik", "Projeler", "Örnekler"],
                        "type": "multiple"
                    },
                    "type": "lesson"
                },
                {
                    "id": "3",
                    "title": "Final Değerlendirme",
                    "description": "Kapsamlı değerlendirme ve gelecek planları",
                    "objectives": ["Genel değerlendirme", "İlerleme ölçümü"],
                    "resources": ["Değerlendirme araçları"],
                    "quiz": {
                        "question": "Genel memnuniyetiniz nedir?",
                        "options": ["Çok memnun", "Memnun", "Orta", "Geliştirilmeli"],
                        "type": "multiple"
                    },
                    "type": "exam"
                }
            ]
        } 