"""Pydantic 请求/响应模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ===== Word =====
class WordCreate(BaseModel):
    word: str
    phonetic: str = ""
    meaning: str = ""
    cat: str = "finance"
    example: str = ""


class WordUpdate(BaseModel):
    phonetic: Optional[str] = None
    meaning: Optional[str] = None
    cat: Optional[str] = None
    example: Optional[str] = None


class WordOut(BaseModel):
    id: int
    word: str
    phonetic: str
    meaning: str
    cat: str
    example: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ===== Dialogue =====
class DialogueBody(BaseModel):
    s: str
    t: str


class DialogueCreate(BaseModel):
    id: str
    scene: str
    desc: str = ""
    body: List[DialogueBody]
    keywords: List[str]
    cat: str = "biz"
    level: str = "B1"
    stage: str = "1"
    stage_order: int = 1


class DialogueUpdate(BaseModel):
    scene: Optional[str] = None
    desc: Optional[str] = None
    body: Optional[List[DialogueBody]] = None
    keywords: Optional[List[str]] = None
    cat: Optional[str] = None
    level: Optional[str] = None
    stage: Optional[str] = None
    stage_order: Optional[int] = None


class DialogueOut(BaseModel):
    id: str
    scene: str
    desc: str
    body: Any
    keywords: Any
    cat: str
    level: str
    stage: str
    stage_order: int

    model_config = {"from_attributes": True}


# ===== Resource =====
class ResourceCreate(BaseModel):
    name: str
    desc: str = ""
    url: str
    cat: str = "video"
    src: str = "official"
    icon: str = "📺"


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    desc: Optional[str] = None
    url: Optional[str] = None
    cat: Optional[str] = None
    src: Optional[str] = None
    icon: Optional[str] = None


class ResourceOut(BaseModel):
    id: int
    name: str
    desc: str
    url: str
    cat: str
    src: str
    icon: str

    model_config = {"from_attributes": True}


# ===== Learning Log =====
class LogCreate(BaseModel):
    user_id: str = "default"
    date: str
    dtype: str
    detail: str = ""


class LogOut(BaseModel):
    id: int
    user_id: str
    date: str
    dtype: str
    detail: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ===== User Progress =====
class ProgressUpdate(BaseModel):
    mastered_words: Optional[List[str]] = None
    completed_daily_words: Optional[List[str]] = None
    learned_dialogues: Optional[List[str]] = None
    favorites: Optional[List[Any]] = None
    song_likes: Optional[List[Any]] = None
    song_dislikes: Optional[List[Any]] = None
    prefs: Optional[dict] = None
    daily_words_data: Optional[List[Any]] = None
    dialog_prefs: Optional[dict] = None


class ProgressOut(BaseModel):
    user_id: str
    mastered_words: Any = []
    completed_daily_words: Any = []
    learned_dialogues: Any = []
    favorites: Any = []
    song_likes: Any = []
    song_dislikes: Any = []
    prefs: Any = {}
    daily_words_data: Any = []
    dialog_prefs: Any = {}
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
