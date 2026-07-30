"""数据库连接与会话管理。

云端部署说明：
- 设置环境变量 DATABASE_URL（postgresql://...）即使用外部 Postgres，数据持久、不随重启丢失。
- 未设置时使用本地 SQLite（data/english.db），适合本地开发。
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "english.db")

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres"):
    # 云端：外部 Postgres（如 Neon / Render Postgres / Supabase）
    SQLALCHEMY_URL = DATABASE_URL
    CONNECT_ARGS = {}
    print("[db] using Postgres from DATABASE_URL")
else:
    # 本地：SQLite
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    SQLALCHEMY_URL = f"sqlite:///{DB_PATH}"
    CONNECT_ARGS = {"check_same_thread": False}
    print("[db] using local SQLite")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine(SQLALCHEMY_URL, connect_args=CONNECT_ARGS, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """建表（首次启动自动调用）"""
    Base.metadata.create_all(bind=engine)
