from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database
import os
from dotenv import load_dotenv

load_dotenv()

# SQLite veritabanı URL'i
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skillmatch.db")

# Database instance (async için)
database = Database(DATABASE_URL)

# SQLAlchemy setup
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()
Base = declarative_base(metadata=metadata)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database bağlantısını başlat
async def connect_db():
    await database.connect()
    
# Database bağlantısını kapat
async def disconnect_db():
    await database.disconnect() 