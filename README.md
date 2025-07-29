# SkillMatch AI - Kişiselleştirilmiş Mikro Eğitim Asistanı

Kullanıcının öğrenme hedefleri ve zamanına göre kişiye özel mikro eğitim yol haritası oluşturan full-stack uygulama.

## 🚀 Proje Yapısı

```
SkillMatchAI/
├── frontend/          # Next.js React frontend
│   ├── app/          # Next.js 13+ App Router
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   └── public/       # Static assets
├── backend/          # Python FastAPI backend
│   ├── main.py       # FastAPI application
│   ├── models.py     # Database models
│   ├── routes.py     # API endpoints
│   └── gemini_service.py # AI integration
└── README.md         # Project documentation
```

## ✨ Özellikler

### 🎯 Core Features
- **Kişiselleştirilmiş Öğrenme Planları**: Gemini AI ile kullanıcıya özel eğitim içerikleri
- **Ağaç Yapısında Yol Haritası**: Interactive öğrenme akışı
- **Geri Bildirim Sistemi**: Kullanıcı deneyimini sürekli iyileştirme
- **Sentiment Analizi**: Geri bildirimlerin otomatik değerlendirmesi
- **Analytics Dashboard**: Öğrenme istatistikleri ve performans metrikleri

### 🛠️ Tech Stack

**Frontend:**
- ⚛️ **Next.js 14** - React framework with App Router
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧩 **Shadcn/ui** - Modern component library
- 📱 **Responsive Design** - Mobile-first approach

**Backend:**
- 🐍 **Python 3.9+** - Programming language
- ⚡ **FastAPI** - Modern web framework
- 🗄️ **SQLAlchemy** - SQL toolkit and ORM
- 🤖 **Google Gemini AI** - AI-powered content generation
- 📊 **SQLite** - Lightweight database

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **Python** 3.8+
- **pnpm** (recommended) or npm
- **Google Gemini API Key**

### 1. Clone Repository
```bash
git clone https://github.com/TarikKilic248/SkillMatchAI.git
cd SkillMatchAI
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Auto setup (recommended)
python3 setup.py

# Manual setup alternative
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp env_example.txt .env
# Edit .env and add your Gemini API key

# Start backend server
python3 start.py
```

### 3. Frontend Setup
```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📚 API Documentation

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-plan` | POST | Generate new learning plan |
| `/api/regenerate-plan` | POST | Update plan based on feedback |
| `/api/save-feedback` | POST | Save user feedback |
| `/api/user-stats/{id}` | GET | Get user statistics |
| `/api/analytics` | GET | Get system analytics |

### Example API Usage

```javascript
// Generate learning plan
const response = await fetch('http://localhost:8000/api/generate-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    learningGoal: "Frontend geliştirme uzmanı olmak",
    dailyTime: "1hour",
    duration: "4weeks",
    learningStyle: "görsel ve uygulamalı öğrenme",
    targetLevel: "intermediate"
  })
});
```

## 🔧 Development

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Project Commands

**Backend:**
```bash
cd backend
python3 start.py --status      # Check project status
python3 start.py --reload      # Development mode
python3 start.py --test        # Run tests
```

**Frontend:**
```bash
cd frontend
pnpm dev          # Development server
pnpm build        # Production build
pnpm lint         # Linting
pnpm type-check   # Type checking
```

## 📊 Analytics & Monitoring

The application tracks:
- 👥 User engagement metrics
- 📈 Learning plan completion rates
- 💬 Feedback sentiment analysis
- ⚡ API performance metrics
- 🎯 Popular learning goals

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Demo**: [Live Demo](https://skillmatch-ai.vercel.app) *(Coming Soon)*
- **API Docs**: [Swagger UI](http://localhost:8000/docs)
- **Repository**: [GitHub](https://github.com/TarikKilic248/SkillMatchAI)

## 📧 Contact

- **Developer**: Tarik Kılıç
- **GitHub**: [@TarikKilic248](https://github.com/TarikKilic248)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
