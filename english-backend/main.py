"""英语工作台后端 API 服务"""
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
import os, random, hashlib, datetime as dt

from database import init_db, get_db, SessionLocal
from models import Word, Dialogue, Resource, LearningLog, UserProgress
from schemas import (
    WordCreate, WordUpdate, WordOut,
    DialogueCreate, DialogueUpdate, DialogueOut,
    ResourceCreate, ResourceUpdate, ResourceOut,
    LogCreate, LogOut,
    ProgressUpdate, ProgressOut,
)

app = FastAPI(title="英语工作台 API", version="1.0.0")

# CORS（允许 web 客户端跨域）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 启动时建表；若库为空则自动播种（便于云端首次启动即有数据）
@app.on_event("startup")
def startup():
    init_db()
    try:
        from database import SessionLocal
        from models import Word
        db = SessionLocal()
        try:
            if db.query(Word).count() == 0:
                print("[startup] empty db, seeding...")
                from seed import run_seed
                run_seed()
        finally:
            db.close()
    except Exception as e:
        print("[startup] auto-seed skipped:", e)


# ==================== 单词 ====================
@app.get("/api/words", response_model=List[WordOut])
def list_words(
    cat: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(100, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    q = db.query(Word)
    if cat and cat != "all":
        q = q.filter(Word.cat == cat)
    if search:
        kw = f"%{search}%"
        q = q.filter((Word.word.ilike(kw)) | (Word.meaning.ilike(kw)))
    total = q.count()
    items = q.order_by(Word.id).offset((page - 1) * size).limit(size).all()
    return items


@app.get("/api/words/count")
def count_words(db: Session = Depends(get_db)):
    return {"total": db.query(Word).count()}


@app.post("/api/words", response_model=WordOut, status_code=201)
def create_word(data: WordCreate, db: Session = Depends(get_db)):
    existing = db.query(Word).filter(Word.word == data.word).first()
    if existing:
        raise HTTPException(400, "单词已存在")
    w = Word(**data.model_dump())
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@app.put("/api/words/{word_id}", response_model=WordOut)
def update_word(word_id: int, data: WordUpdate, db: Session = Depends(get_db)):
    w = db.query(Word).filter(Word.id == word_id).first()
    if not w:
        raise HTTPException(404, "单词不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(w, k, v)
    db.commit()
    db.refresh(w)
    return w


@app.delete("/api/words/{word_id}")
def delete_word(word_id: int, db: Session = Depends(get_db)):
    w = db.query(Word).filter(Word.id == word_id).first()
    if not w:
        raise HTTPException(404, "单词不存在")
    db.delete(w)
    db.commit()
    return {"ok": True}


# ==================== 对话 ====================
@app.get("/api/dialogues", response_model=List[DialogueOut])
def list_dialogues(
    cat: Optional[str] = Query(None),
    stage: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Dialogue)
    if cat and cat != "all":
        q = q.filter(Dialogue.cat == cat)
    if stage is not None:
        q = q.filter(Dialogue.stage == stage)
    return q.order_by(Dialogue.stage, Dialogue.stage_order).all()


@app.post("/api/dialogues", response_model=DialogueOut, status_code=201)
def create_dialogue(data: DialogueCreate, db: Session = Depends(get_db)):
    if db.query(Dialogue).filter(Dialogue.id == data.id).first():
        raise HTTPException(400, "对话ID已存在")
    d = Dialogue(**data.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@app.put("/api/dialogues/{dialogue_id}", response_model=DialogueOut)
def update_dialogue(dialogue_id: str, data: DialogueUpdate, db: Session = Depends(get_db)):
    d = db.query(Dialogue).filter(Dialogue.id == dialogue_id).first()
    if not d:
        raise HTTPException(404, "对话不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


@app.delete("/api/dialogues/{dialogue_id}")
def delete_dialogue(dialogue_id: str, db: Session = Depends(get_db)):
    d = db.query(Dialogue).filter(Dialogue.id == dialogue_id).first()
    if not d:
        raise HTTPException(404, "对话不存在")
    db.delete(d)
    db.commit()
    return {"ok": True}


# ==================== 资源 ====================
@app.get("/api/resources", response_model=List[ResourceOut])
def list_resources(
    cat: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Resource)
    if cat and cat != "all":
        q = q.filter(Resource.cat == cat)
    if search:
        kw = f"%{search}%"
        q = q.filter((Resource.name.ilike(kw)) | (Resource.desc.ilike(kw)))
    return q.order_by(Resource.id).all()


@app.post("/api/resources", response_model=ResourceOut, status_code=201)
def create_resource(data: ResourceCreate, db: Session = Depends(get_db)):
    r = Resource(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@app.put("/api/resources/{res_id}", response_model=ResourceOut)
def update_resource(res_id: int, data: ResourceUpdate, db: Session = Depends(get_db)):
    r = db.query(Resource).filter(Resource.id == res_id).first()
    if not r:
        raise HTTPException(404, "资源不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return r


@app.delete("/api/resources/{res_id}")
def delete_resource(res_id: int, db: Session = Depends(get_db)):
    r = db.query(Resource).filter(Resource.id == res_id).first()
    if not r:
        raise HTTPException(404, "资源不存在")
    db.delete(r)
    db.commit()
    return {"ok": True}


# ==================== 学习记录 ====================
@app.get("/api/logs", response_model=List[LogOut])
def list_logs(
    user_id: str = Query("default"),
    date: Optional[str] = Query(None),
    dtype: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    q = db.query(LearningLog).filter(LearningLog.user_id == user_id)
    if date:
        q = q.filter(LearningLog.date == date)
    if dtype:
        q = q.filter(LearningLog.dtype == dtype)
    return q.order_by(LearningLog.created_at.desc()).limit(limit).all()


@app.post("/api/logs", response_model=LogOut, status_code=201)
def create_log(data: LogCreate, db: Session = Depends(get_db)):
    log = LearningLog(**data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@app.get("/api/logs/dates")
def log_dates(user_id: str = Query("default"), db: Session = Depends(get_db)):
    rows = (
        db.query(LearningLog.date)
        .filter(LearningLog.user_id == user_id)
        .distinct()
        .order_by(LearningLog.date.desc())
        .all()
    )
    return [r[0] for r in rows]


# ==================== 用户进度 ====================
@app.get("/api/progress/{user_id}", response_model=ProgressOut)
def get_progress(user_id: str = "default", db: Session = Depends(get_db)):
    p = db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
    if not p:
        p = UserProgress(user_id=user_id)
        db.add(p)
        db.commit()
        db.refresh(p)
    return p


@app.put("/api/progress/{user_id}", response_model=ProgressOut)
def update_progress(user_id: str, data: ProgressUpdate, db: Session = Depends(get_db)):
    p = db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
    if not p:
        p = UserProgress(user_id=user_id)
        db.add(p)
    for k, v in data.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


# ==================== 批量导入 ====================
@app.post("/api/import/words")
def import_words(words: List[WordCreate], db: Session = Depends(get_db)):
    count = 0
    for w in words:
        if not db.query(Word).filter(Word.word == w.word).first():
            db.add(Word(**w.model_dump()))
            count += 1
    db.commit()
    return {"imported": count, "total": len(words)}


@app.post("/api/import/dialogues")
def import_dialogues(dialogues: List[DialogueCreate], db: Session = Depends(get_db)):
    count = 0
    for d in dialogues:
        if not db.query(Dialogue).filter(Dialogue.id == d.id).first():
            db.add(Dialogue(**d.model_dump()))
            count += 1
    db.commit()
    return {"imported": count, "total": len(dialogues)}


@app.post("/api/import/resources")
def import_resources(resources: List[ResourceCreate], db: Session = Depends(get_db)):
    count = 0
    for r in resources:
        if not db.query(Resource).filter(Resource.url == r.url).first():
            db.add(Resource(**r.model_dump()))
            count += 1
    db.commit()
    return {"imported": count, "total": len(resources)}


# ==================== 统计数据 ====================
@app.get("/api/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "words": db.query(Word).count(),
        "dialogues": db.query(Dialogue).count(),
        "resources": db.query(Resource).count(),
        "logs": db.query(LearningLog).count(),
    }


# ==================== 每日推荐（RSS 博客 + iTunes 歌曲） ====================
_daily_cache = {}

# 英文学习 RSS 源列表
RSS_SOURCES = [
    {"name": "BBC Learning English", "url": "https://feeds.bbci.co.uk/learningenglish/rss.xml"},
    {"name": "VOA Learning English", "url": "https://learningenglish.voanews.com/api/zq$omekviwquq"},
    {"name": "Breaking News English", "url": "https://feeds.feedburner.com/breakingnewsenglish"},
    {"name": "EnglishClub", "url": "https://www.englishclub.com/feed/"},
]

# iTunes 搜索关键词池（每次随机选 2 个组合）
SONG_KEYWORDS = ["english pop", "acoustic", "indie folk", "jazz vocal", "singer songwriter",
                 "classic rock", "british pop", "american folk", "alternative rock", "soul music"]

def _fetch_blogs():
    """聚合 RSS 源，返回 3 篇文章"""
    import feedparser
    items = []
    for src in RSS_SOURCES:
        try:
            feed = feedparser.parse(src["url"])
            for entry in feed.entries[:5]:
                items.append({
                    "title": entry.get("title", "").strip(),
                    "url": entry.get("link", ""),
                    "summary": (entry.get("summary", "") or entry.get("description", ""))[:200],
                    "source": src["name"],
                    "published": entry.get("published", "")
                })
        except Exception as e:
            print(f"[RSS] {src['name']} failed:", e)
    # 按发布时间排序，取前 3
    items.sort(key=lambda x: x.get("published", ""), reverse=True)
    return items[:3] if items else _fallback_blogs()

def _fallback_blogs():
    """RSS 全失败时的候补"""
    return [
        {"title": "How to Improve Your English Speaking Skills", "url": "https://www.bbc.co.uk/learningenglish/", "summary": "Practical tips for improving spoken English.", "source": "候补推荐"},
        {"title": "The Secret to Learning English Grammar", "url": "https://learningenglish.voanews.com/", "summary": "Understanding grammar through real-world examples.", "source": "候补推荐"},
        {"title": "10 English Idioms You Should Know", "url": "https://www.englishclub.com/", "summary": "Common idioms used in business and daily conversation.", "source": "候补推荐"},
    ]

def _fetch_songs():
    """从 iTunes API 随机搜索英文歌曲，返回 3 首"""
    import requests as req
    kw1, kw2 = random.sample(SONG_KEYWORDS, 2)
    query = f"{kw1} {kw2}"
    track_ids_seen = set()
    songs = []
    for kw in [query, random.choice(SONG_KEYWORDS)]:
        try:
            r = req.get("https://itunes.apple.com/search", 
                       params={"term": kw, "media": "music", "entity": "song", "limit": 50},
                       timeout=10)
            data = r.json()
            for item in data.get("results", []):
                tid = str(item.get("trackId", ""))
                if tid in track_ids_seen:
                    continue
                track_ids_seen.add(tid)
                songs.append({
                    "id": tid,
                    "title": item.get("trackName", ""),
                    "artist": item.get("artistName", ""),
                    "preview_url": item.get("previewUrl", ""),
                    "artwork_url": (item.get("artworkUrl100") or "").replace("100x100", "300x300"),
                    "collection": item.get("collectionName", "")
                })
            if len(songs) >= 6:
                break
        except Exception as e:
            print(f"[iTunes] search failed for '{kw}':", e)
    random.shuffle(songs)
    return songs[:3] if len(songs) >= 3 else _fallback_songs()

def _fallback_songs():
    return [
        {"id": "fb1", "title": "Shape of You", "artist": "Ed Sheeran", "preview_url": "", "artwork_url": ""},
        {"id": "fb2", "title": "Rolling in the Deep", "artist": "Adele", "preview_url": "", "artwork_url": ""},
        {"id": "fb3", "title": "Blinding Lights", "artist": "The Weeknd", "preview_url": "", "artwork_url": ""},
    ]

@app.get("/api/daily/recommend")
def daily_recommend():
    today = dt.datetime.utcnow().strftime("%Y-%m-%d")
    if today in _daily_cache:
        return _daily_cache[today]
    blogs = _fetch_blogs()
    songs = _fetch_songs()
    result = {"date": today, "blogs": blogs, "songs": songs}
    _daily_cache.clear()
    _daily_cache[today] = result
    return result


# ==================== 管理后台 ====================
ADMIN_DIR = os.path.join(os.path.dirname(__file__), "admin")

@app.get("/admin")
@app.get("/admin/")
def admin_page():
    return FileResponse(os.path.join(ADMIN_DIR, "index.html"))


# ==================== 同源托管前端（必须放在所有 /api 路由之后） ====================
# Docker 镜像里前端在 /app/frontend/，本地开发时回退到 ../english-workspace
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_docker_frontend = os.path.join(_backend_dir, "..", "frontend")
_local_frontend = os.path.join(_backend_dir, "..", "english-workspace")
FRONTEND_DIR = _docker_frontend if os.path.isdir(_docker_frontend) else _local_frontend


@app.get("/{full_path:path}")
async def spa(full_path: str):
    """兜底路由：前端静态页（同源部署，免 CORS）。

    /api/* 已在上面定义并优先匹配；这里只兜底前端页面与管理后台子资源。
    """
    if full_path.startswith("admin"):
        candidate = os.path.join(ADMIN_DIR, full_path[len("admin"):].lstrip("/"))
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(ADMIN_DIR, "index.html"))
    candidate = os.path.join(FRONTEND_DIR, full_path)
    if os.path.isfile(candidate):
        return FileResponse(candidate)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8866, reload=True)
