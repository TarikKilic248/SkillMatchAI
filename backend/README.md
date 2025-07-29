# SkillMatch AI Backend

Kişiselleştirilmiş Mikro Eğitim Asistanı'nın Python FastAPI backend servisi.

## 🚀 Özellikler

- **Google Gemini AI Entegrasyonu**: Akıllı öğrenme planları oluşturma
- **RESTful API**: Frontend ile tam entegrasyon
- **SQLite Veritabanı**: Kullanıcı verilerini ve planları kaydetme
- **Sentiment Analizi**: Geri bildirimleri otomatik analiz etme
- **Analytics**: Kullanım istatistikleri ve performans metrikleri
- **Async/Await**: Yüksek performanslı asenkron işlemler
- **CORS Desteği**: Frontend ile güvenli iletişim
- **Hata Yönetimi**: Kapsamlı hata yakalama ve loglama

## 📋 Gereksinimler

- Python 3.8+
- Google Gemini API Key
- Virtual Environment (önerilen)

## 🔧 Kurulum

### 1. Otomatik Kurulum (Önerilen)
```bash
cd backend
python setup.py
```

### 2. Manuel Kurulum

```bash
# Proje klasörüne git
cd backend

# Virtual environment oluştur
python -m venv venv

# Virtual environment'ı aktifleştir
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Paketleri yükle
pip install -r requirements.txt

# Environment dosyasını oluştur
cp env_example.txt .env

# .env dosyasını düzenle ve API anahtarını ekle
nano .env
```

### 3. Environment Konfigürasyonu

`.env` dosyasını düzenleyerek şu bilgileri ekleyin:

```env
# Google Gemini API Key (Zorunlu)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Veritabanı (İsteğe bağlı - varsayılan SQLite)
DATABASE_URL=sqlite:///./skillmatch.db

# Server ayarları (İsteğe bağlı)
API_HOST=0.0.0.0
API_PORT=8000
```

**Gemini API Key nasıl alınır:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. Oluşturulan anahtarı kopyalayıp `.env` dosyasına yapıştırın

## 🚀 Çalıştırma

### Temel Kullanım
```bash
python start.py
```

### Geliştirme Modu (Hot Reload)
```bash
python start.py --reload
```

### Özel Konfigürasyon
```bash
python start.py --host 127.0.0.1 --port 8080 --workers 4
```

### Proje Durumunu Kontrol Etme
```bash
python start.py --status
```

## 📚 API Endpoint'leri

### Ana Endpoint'ler

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/` | GET | Health check |
| `/docs` | GET | API dokümantasyonu (Swagger UI) |
| `/api/generate-plan` | POST | Yeni öğrenme planı oluştur |
| `/api/regenerate-plan` | POST | Planı geri bildirimlere göre güncelle |
| `/api/save-feedback` | POST | Kullanıcı geri bildirimi kaydet |
| `/api/user-stats/{user_id}` | GET | Kullanıcı istatistikleri |
| `/api/analytics` | GET | Genel analitik veriler |

### API Dokümantasyonu
Server çalıştıktan sonra şu adreslerden API dokümantasyonuna erişebilirsiniz:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📝 API Kullanım Örnekleri

### 1. Öğrenme Planı Oluşturma

```python
import requests

url = "http://localhost:8000/api/generate-plan"
data = {
    "learningGoal": "Frontend geliştirme uzmanı olmak",
    "dailyTime": "1hour",
    "duration": "4weeks",
    "learningStyle": "görsel ve uygulamalı öğrenme",
    "targetLevel": "junior'dan orta seviyeye geçmek"
}

response = requests.post(url, json=data)
plan = response.json()
print(plan)
```

### 2. Geri Bildirim Kaydetme

```python
import requests
from datetime import datetime

url = "http://localhost:8000/api/save-feedback"
data = {
    "moduleId": "1",
    "feedback": "Bu modül çok faydalıydı, daha fazla örnek olabilir",
    "userId": "user123",
    "timestamp": datetime.now().isoformat()
}

response = requests.post(url, json=data)
result = response.json()
print(result)
```

## 🗄️ Veritabanı Yapısı

### Tablolar

- **users**: Kullanıcı bilgileri
- **learning_plans**: Öğrenme planları
- **modules**: Plan modülleri
- **feedbacks**: Kullanıcı geri bildirimleri
- **api_usage**: API kullanım istatistikleri

### Veritabanı Yönetimi

```bash
# Veritabanı tablolarını oluştur
python -c "from models import Base; from database import engine; Base.metadata.create_all(bind=engine)"

# SQLite veritabanını görüntüleme
sqlite3 skillmatch.db
.tables
.schema users
```

## 📊 Analitik ve İstatistikler

Backend şu istatistikleri toplar:
- Toplam kullanıcı sayısı
- Oluşturulan plan sayısı
- Tamamlanan modül sayısı
- Geri bildirim analizi (pozitif/negatif/nötr)
- API yanıt süreleri
- Hata oranları

İstatistiklere erişim:
```bash
curl http://localhost:8000/api/analytics
```

## 🔧 Geliştirme

### Kod Yapısı

```
backend/
├── main.py              # FastAPI uygulaması ve konfigürasyon
├── models.py            # SQLAlchemy veritabanı modelleri
├── database.py          # Veritabanı bağlantı konfigürasyonu
├── gemini_service.py    # Google Gemini API entegrasyonu
├── routes.py            # API endpoint'leri
├── requirements.txt     # Python paket listesi
├── setup.py            # Otomatik kurulum script'i
├── start.py            # Server başlatma script'i
└── README.md           # Bu dosya
```

### Yeni Endpoint Ekleme

1. `routes.py` dosyasına yeni endpoint'i ekleyin:
```python
@router.get("/api/new-endpoint")
async def new_endpoint():
    return {"message": "Yeni endpoint"}
```

2. Gerekli model değişiklikleri için `models.py` dosyasını güncelleyin
3. Veritabanı değişiklikeri için migration oluşturun

### Test Etme

```bash
# Test modülü yükleyin
pip install pytest httpx

# Testleri çalıştırın
python start.py --test
```

## 🚨 Sorun Giderme

### Yaygın Sorunlar

1. **"Module not found" Hatası**
   ```bash
   # Virtual environment'ın aktif olduğunu kontrol edin
   python start.py --status
   ```

2. **"Gemini API Key Invalid" Hatası**
   ```bash
   # .env dosyasındaki API key'i kontrol edin
   cat .env | grep GOOGLE_GENERATIVE_AI_API_KEY
   ```

3. **"Database Connection Error"**
   ```bash
   # Veritabanı dosyasının yaratılabilir olduğunu kontrol edin
   touch skillmatch.db
   chmod 666 skillmatch.db
   ```

4. **"Port already in use" Hatası**
   ```bash
   # Farklı port kullanın
   python start.py --port 8080
   ```

### Log'ları İnceleme

Backend tüm işlemleri loglar. Hata durumunda konsol çıktısını inceleyin:

```bash
# Detaylı log için
python start.py --reload
```

## 📈 Performans

### Önerilen Ayarlar

**Geliştirme:**
```bash
python start.py --reload --workers 1
```

**Prodüksiyon:**
```bash
python start.py --workers 4 --host 0.0.0.0 --port 8000
```

### Monitoring

API performansını izlemek için:
- `/api/analytics` endpoint'ini kullanın
- Response time'ları `api_usage` tablosunda saklanır
- SQLite veritabanı boyutunu düzenli kontrol edin

## 🤝 Katkıda Bulunma

1. Fork edin
2. Yeni branch oluşturun (`git checkout -b feature/new-feature`)
3. Değişiklikleri commit edin (`git commit -am 'Add new feature'`)
4. Branch'i push edin (`git push origin feature/new-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🔗 Bağlantılar

- [Google Gemini AI](https://ai.google.dev/)
- [FastAPI Dokümantasyonu](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://sqlalchemy.org/)
- [Uvicorn](https://uvicorn.org/)

## 💬 Destek

Sorularınız için:
- GitHub Issues oluşturun
- Dokümantasyonu inceleyin: http://localhost:8000/docs
- Backend durumunu kontrol edin: `python start.py --status`

---

**Not**: Bu backend, SkillMatch AI projesinin bir parçasıdır ve Next.js frontend ile birlikte çalışacak şekilde tasarlanmıştır. 