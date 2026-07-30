"""数据库 ORM 模型"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, autoincrement=True)
    word = Column(String(200), nullable=False, unique=True, index=True)
    phonetic = Column(String(200), default="")
    meaning = Column(String(500), default="")
    cat = Column(String(50), nullable=False, default="finance")
    example = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Dialogue(Base):
    __tablename__ = "dialogues"

    id = Column(String(50), primary_key=True)
    scene = Column(String(200), nullable=False)
    desc = Column(String(500), default="")
    body = Column(JSON, nullable=False)         # [{s: "A", t: "..."}, ...]
    keywords = Column(JSON, nullable=False)      # ["key1","key2",...]
    cat = Column(String(50), default="biz")
    level = Column(String(20), default="B1")
    stage = Column(String(100), default="1")
    stage_order = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    desc = Column(String(500), default="")
    url = Column(String(500), nullable=False)
    cat = Column(String(50), nullable=False, default="video")
    src = Column(String(100), default="official")
    icon = Column(String(10), default="📺")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class LearningLog(Base):
    __tablename__ = "learning_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, default="default", index=True)
    date = Column(String(20), nullable=False, index=True)
    dtype = Column(String(30), nullable=False)     # word/dialogue/resource/review
    detail = Column(String(500), default="")
    created_at = Column(DateTime, server_default=func.now())


class UserProgress(Base):
    __tablename__ = "user_progress"

    user_id = Column(String(100), primary_key=True, default="default")
    mastered_words = Column(JSON, default=list)
    completed_daily_words = Column(JSON, default=list)
    learned_dialogues = Column(JSON, default=list)
    favorites = Column(JSON, default=list)
    prefs = Column(JSON, default=dict)
    daily_words_data = Column(JSON, default=list)
    dialog_prefs = Column(JSON, default=dict)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
