#!/usr/bin/env python3
"""
SkillMatch AI Backend Başlatma Script'i
"""

import os
import sys
import argparse
import subprocess
import signal
from pathlib import Path

def get_python_command():
    """Doğru Python komutunu belirle"""
    if os.name == 'nt':  # Windows
        return "venv\\Scripts\\python"
    else:  # Unix/Linux/MacOS
        return "venv/bin/python3"

def check_environment():
    """Gerekli dosyaları kontrol et"""
    required_files = [
        "main.py",
        "requirements.txt",
        "models.py",
        "database.py",
        "gemini_service.py",
        "routes.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Eksik dosyalar: {', '.join(missing_files)}")
        print("Lütfen önce 'python setup.py' komutunu çalıştırın")
        return False
    
    # Virtual environment kontrolü
    if not os.path.exists("venv"):
        print("❌ Virtual environment bulunamadı")
        print("Lütfen önce 'python setup.py' komutunu çalıştırın")
        return False
    
    # .env dosyası kontrolü
    if not os.path.exists(".env"):
        print("⚠️ .env dosyası bulunamadı")
        print("env_example.txt dosyasını .env olarak kopyalayın ve API anahtarlarınızı ekleyin")
        return False
    
    return True

def run_server(host="0.0.0.0", port=8000, reload=False, workers=1):
    """Sunucuyu başlat"""
    python_cmd = get_python_command()
    
    cmd = [
        python_cmd, "-m", "uvicorn", "main:app",
        "--host", host,
        "--port", str(port),
        "--workers", str(workers)
    ]
    
    if reload:
        cmd.append("--reload")
    
    print(f"🚀 Server başlatılıyor...")
    print(f"📍 URL: http://{host}:{port}")
    print(f"📚 API Dokümantasyonu: http://{host}:{port}/docs")
    print(f"🔄 Hot Reload: {'Açık' if reload else 'Kapalı'}")
    print(f"👥 Worker Sayısı: {workers}")
    print("\n✋ Sunucuyu durdurmak için Ctrl+C tuşlayın")
    print("=" * 50)
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n\n🛑 Sunucu durduruldu")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Sunucu başlatma hatası: {e}")
        return False
    
    return True

def run_tests():
    """Test'leri çalıştır"""
    python_cmd = get_python_command()
    
    print("🧪 Testler çalıştırılıyor...")
    
    try:
        result = subprocess.run([
            python_cmd, "-m", "pytest", "-v", "tests/"
        ], check=True, capture_output=True, text=True)
        
        print("✅ Tüm testler başarıyla geçti!")
        print(result.stdout)
        return True
        
    except subprocess.CalledProcessError as e:
        print("❌ Testler başarısız!")
        print(e.stdout)
        print(e.stderr)
        return False
    except FileNotFoundError:
        print("⚠️ pytest bulunamadı. Test klasörü mevcut değil.")
        return True

def show_status():
    """Proje durumunu göster"""
    print("📊 SkillMatch AI Backend Durumu")
    print("=" * 40)
    
    # Dosya kontrolü
    files_status = {
        "main.py": "Ana uygulama dosyası",
        "models.py": "Veritabanı modelleri",
        "database.py": "Veritabanı konfigürasyonu",
        "gemini_service.py": "Gemini API servisi",
        "routes.py": "API endpoint'leri",
        ".env": "Environment variables",
        "venv/": "Virtual environment",
        "skillmatch.db": "SQLite veritabanı"
    }
    
    for file, description in files_status.items():
        status = "✅" if os.path.exists(file) else "❌"
        print(f"{status} {file:<20} - {description}")
    
    print("\n📈 İstatistikler:")
    
    # Kod satırı sayma
    total_lines = 0
    py_files = ["main.py", "models.py", "database.py", "gemini_service.py", "routes.py"]
    for file in py_files:
        if os.path.exists(file):
            with open(file, 'r', encoding='utf-8') as f:
                lines = len(f.readlines())
                total_lines += lines
                print(f"  {file}: {lines} satır")
    
    print(f"  Toplam: {total_lines} satır")
    
    # Veritabanı boyutu
    if os.path.exists("skillmatch.db"):
        size = os.path.getsize("skillmatch.db")
        print(f"  Veritabanı boyutu: {size} byte")

def main():
    """Ana fonksiyon"""
    parser = argparse.ArgumentParser(description="SkillMatch AI Backend Yönetimi")
    parser.add_argument("--host", default="0.0.0.0", help="Server host adresi")
    parser.add_argument("--port", type=int, default=8000, help="Server port numarası")
    parser.add_argument("--reload", action="store_true", help="Hot reload aktif et (development)")
    parser.add_argument("--workers", type=int, default=1, help="Worker process sayısı")
    parser.add_argument("--test", action="store_true", help="Testleri çalıştır")
    parser.add_argument("--status", action="store_true", help="Proje durumunu göster")
    
    args = parser.parse_args()
    
    # Çalışma dizinini backend klasörü yap
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Status komutu
    if args.status:
        show_status()
        return
    
    # Test komutu
    if args.test:
        if not check_environment():
            sys.exit(1)
        success = run_tests()
        sys.exit(0 if success else 1)
    
    # Environment kontrolü
    if not check_environment():
        sys.exit(1)
    
    # Sunucuyu başlat
    success = run_server(
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 