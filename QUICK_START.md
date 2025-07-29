# 🚀 SkillMatch AI - Quick Start Guide

Bu guide ile projeyi 5 dakikada çalıştırabilirsiniz.

## 📋 Gereksinimler

- **Python 3.8+** 
- **Node.js 18+**
- **pnpm** (önerilen) veya npm
- **Google Gemini API Key** ([Buradan alın](https://makersuite.google.com/app/apikey))

## ⚡ Hızlı Başlangıç

### 1️⃣ Proje Klonlama
```bash
git clone https://github.com/TarikKilic248/SkillMatchAI.git
cd SkillMatchAI
```

### 2️⃣ Backend Kurulumu (Terminal 1)
```bash
# Backend klasörüne git
cd backend

# Otomatik kurulum
python3 setup.py

# Environment konfigürasyon
cp env_example.txt .env
# .env dosyasını düzenleyip Gemini API key'inizi ekleyin

# Backend'i başlat
python3 start.py
```

**Backend çalıştığında:** 🎉
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3️⃣ Frontend Kurulumu (Terminal 2)
```bash
# Frontend klasörüne git (yeni terminal)
cd frontend

# Dependencies yükle
pnpm install
# veya: npm install

# Environment konfigürasyon
cp env-example.txt .env.local
# Gerekirse backend URL'ini düzenleyin

# Frontend'i başlat
pnpm dev
# veya: npm run dev
```

**Frontend çalıştığında:** 🎉
- Web App: http://localhost:3000

## 🎯 Test Etme

1. **Backend Test:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Frontend Test:**
   - http://localhost:3000 adresine gidin
   - Öğrenme planı oluşturmayı deneyin

## 🔧 Geliştirme Komutları

### Backend
```bash
cd backend
python3 start.py --status      # Durum kontrolü
python3 start.py --reload      # Hot reload
python3 start.py --help        # Tüm seçenekler
```

### Frontend
```bash
cd frontend
pnpm dev          # Geliştirme serveri
pnpm build        # Production build
pnpm lint         # Linting
```

## 🚨 Sorun Giderme

### Backend Sorunları
```bash
# Virtual environment kontrolü
cd backend && python3 start.py --status

# API key kontrolü
grep GOOGLE_GENERATIVE_AI_API_KEY backend/.env
```

### Frontend Sorunları
```bash
# Dependencies kontrolü
cd frontend && pnpm install

# Backend bağlantı kontrolü
grep NEXT_PUBLIC_API_BASE_URL frontend/.env.local
```

### Port Çakışması
```bash
# Backend farklı port
cd backend && python3 start.py --port 8080

# Frontend farklı port
cd frontend && pnpm dev -p 3001
```

## 📁 Proje Yapısı

```
SkillMatchAI/
├── backend/          # Python FastAPI backend
│   ├── main.py       # Ana uygulama
│   ├── routes.py     # API endpoints
│   ├── models.py     # Database models
│   └── gemini_service.py # AI integration
├── frontend/         # Next.js React frontend
│   ├── app/          # Next.js App Router
│   ├── components/   # UI components
│   └── lib/          # Utilities
└── README.md         # Detaylı dokümantasyon
```

## 🎉 Başarıyla Çalıştı!

Her iki servis de çalışıyorsa:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

Projeyi geliştirmeye başlayabilirsiniz! 🚀

---

💡 **İpucu**: Daha detaylı bilgi için `README.md` dosyasını okuyun. 