#!/usr/bin/env python3
"""
SkillMatch AI Backend Kurulum Script'i
"""

import os
import subprocess
import sys
import shutil

def run_command(command, check=True):
    """Komutu çalıştır ve sonucu döndür"""
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout, e.stderr

def check_python_version():
    """Python sürümünü kontrol et"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 veya daha yeni bir sürüm gerekli!")
        print(f"Mevcut sürüm: {sys.version}")
        return False
    print(f"✅ Python sürümü: {sys.version.split()[0]}")
    return True

def create_virtual_environment():
    """Virtual environment oluştur"""
    print("🔧 Virtual environment oluşturuluyor...")
    success, stdout, stderr = run_command("python3 -m venv venv")
    if success:
        print("✅ Virtual environment başarıyla oluşturuldu")
        return True
    else:
        print(f"❌ Virtual environment oluşturulamadı: {stderr}")
        return False

def activate_and_install():
    """Virtual environment'ı aktifleştir ve paketleri yükle"""
    print("📦 Paketler yükleniyor...")
    
    # Virtual environment yolunu belirle
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate.bat && "
        pip_cmd = "venv\\Scripts\\pip"
    else:  # Unix/Linux/MacOS
        activate_cmd = "source venv/bin/activate && "
        pip_cmd = "venv/bin/pip"
    
    # Pip'i güncelle
    success, stdout, stderr = run_command(f"{pip_cmd} install --upgrade pip")
    if not success:
        print(f"⚠️ Pip güncelleme hatası: {stderr}")
    
    # Requirements'ları yükle
    success, stdout, stderr = run_command(f"{pip_cmd} install -r requirements.txt")
    if success:
        print("✅ Paketler başarıyla yüklendi")
        return True
    else:
        print(f"❌ Paket yükleme hatası: {stderr}")
        return False

def setup_environment():
    """Environment dosyasını oluştur"""
    env_file = ".env"
    env_example = "env_example.txt"
    
    if not os.path.exists(env_file):
        if os.path.exists(env_example):
            shutil.copy(env_example, env_file)
            print(f"✅ {env_file} dosyası oluşturuldu")
            print(f"🔧 {env_file} dosyasını düzenleyerek API anahtarlarınızı ekleyin")
            return True
        else:
            print(f"❌ {env_example} dosyası bulunamadı")
            return False
    else:
        print(f"✅ {env_file} dosyası zaten mevcut")
        return True

def create_database():
    """Veritabanını oluştur"""
    print("🗄️ Veritabanı oluşturuluyor...")
    
    if os.name == 'nt':  # Windows
        python_cmd = "venv\\Scripts\\python"
    else:  # Unix/Linux/MacOS
        python_cmd = "venv/bin/python3"
    
    # Database oluşturma script'i
    create_db_script = """
from models import Base
from database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Veritabanı tabloları başarıyla oluşturuldu")
except Exception as e:
    logger.error(f"❌ Veritabanı oluşturma hatası: {e}")
"""
    
    with open("create_db.py", "w", encoding="utf-8") as f:
        f.write(create_db_script)
    
    success, stdout, stderr = run_command(f"{python_cmd} create_db.py")
    
    # Geçici dosyayı sil
    if os.path.exists("create_db.py"):
        os.remove("create_db.py")
    
    if success:
        print("✅ Veritabanı başarıyla oluşturuldu")
        return True
    else:
        print(f"❌ Veritabanı oluşturma hatası: {stderr}")
        return False

def main():
    """Ana kurulum fonksiyonu"""
    print("🚀 SkillMatch AI Backend Kurulumu Başlıyor...")
    print("=" * 50)
    
    # Python sürüm kontrolü
    if not check_python_version():
        return False
    
    # Virtual environment oluştur
    if not os.path.exists("venv"):
        if not create_virtual_environment():
            return False
    else:
        print("✅ Virtual environment zaten mevcut")
    
    # Paketleri yükle
    if not activate_and_install():
        return False
    
    # Environment dosyasını oluştur
    if not setup_environment():
        return False
    
    # Veritabanını oluştur
    if not create_database():
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Kurulum başarıyla tamamlandı!")
    print("\n📋 Sonraki Adımlar:")
    print("1. .env dosyasını düzenleyerek Gemini API anahtarınızı ekleyin")
    print("2. Uygulamayı başlatmak için: python start.py")
    print("3. API dokümantasyonu: http://localhost:8000/docs")
    print("\n💡 İpucu: 'python start.py --help' ile tüm seçenekleri görebilirsiniz")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 