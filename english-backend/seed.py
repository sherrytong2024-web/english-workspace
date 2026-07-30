"""种子数据：写入数据库。

设计：
- 本地优先用 Node.js 从 index.html 抽取 SEED_WORDS / SEED_DIALOGS / RECOMMEND_POOL。
- 抽取结果缓存到 seed_data.json，云端部署时直接读取该文件（无需 Node）。
- run_seed() 供 main.py 启动时自动调用，也可 `python seed.py` 手动执行。
"""
import subprocess, json, os, sys, tempfile, shutil

sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, SessionLocal
from models import Word, Dialogue, Resource

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(BASE_DIR, "..", "english-workspace", "index.html")
SEED_JSON = os.path.join(BASE_DIR, "seed_data.json")

# Node 探测：环境变量 > PATH > 本地固定路径兜底
LOCAL_NODE = "/Users/sherry/.workbuddy/binaries/node/versions/22.22.2/bin/node"
NODE = os.environ.get("NODE_PATH") or shutil.which("node") or (
    LOCAL_NODE if os.path.exists(LOCAL_NODE) else None
)


def extract_vars(html_path):
    """用 Node.js eval JS 源码，一次性提取全部种子变量为 JSON。"""
    node_script = """const fs = require('fs');
var html = fs.readFileSync('""" + html_path + """', 'utf-8');
var match = html.match(/<script>([\\s\\S]*?)<\\/script>/);
if (!match) { console.log(JSON.stringify({error:'no script tag'})); process.exit(1); }
var js = match[1];

// 构造最小浏览器 mock
var _store = {};
global.localStorage = { getItem: function(k){ return _store[k]||null; }, setItem: function(k,v){ _store[k]=v; } };
global.document = { addEventListener: function(){}, querySelector: function(){ return null; }, getElementById: function(){ return null; }, createElement: function(){ return {style:{}}; } };
global.window = global;
global.navigator = {};
global.setTimeout = function(f){ try{f()}catch(_){} };
global.clearTimeout = function(){};

function todayStr(){ return new Date().toISOString().slice(0,10); }
var CATS = {
  finance: {cls:'fin',name:'金融'}, biz: {cls:'biz',name:'职场商务'},
  daily: {cls:'daily',name:'日常'}, analysis: {cls:'analysis',name:'分析'}
};
var DB = { load: function(k, d){ return d; }, save: function(){} };
var state = { words:[], reviewState:{ mastered:[] }, completedDailyWords:[], dailyWords:[], learnedDialogues:[], dialogPrefs:{}, prefs:{cat:'all'} };

// 关键：去掉 const 声明，让 eval 的赋值直接到全局
var _js = js.replace(/\\bconst SEED_WORDS\\s*=\\s*/g, 'SEED_WORDS = ')
           .replace(/\\bconst SEED_DIALOGS\\s*=\\s*/g, 'SEED_DIALOGS = ')
           .replace(/\\bconst RECOMMEND_POOL\\s*=\\s*/g, 'RECOMMEND_POOL = ');

try {
  eval(_js);
} catch(e) {
  // 忽略后续代码报错（ensureDailyWords 等依赖 DOM/state 的逻辑）
}

// 现在全局作用域应该有这些变量了
var words = (typeof SEED_WORDS !== 'undefined' && Array.isArray(SEED_WORDS)) ? SEED_WORDS : [];
var dialogues = (typeof SEED_DIALOGS !== 'undefined' && Array.isArray(SEED_DIALOGS)) ? SEED_DIALOGS : [];
var resources = (typeof RECOMMEND_POOL !== 'undefined' && Array.isArray(RECOMMEND_POOL)) ? RECOMMEND_POOL : [];

console.log(JSON.stringify({ words:words, dialogues:dialogues, resources:resources }));
"""
    fd, tmp = tempfile.mkstemp(suffix=".js")
    with os.fdopen(fd, "w") as f:
        f.write(node_script)
    try:
        result = subprocess.run([NODE, tmp], capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print("Node stderr:", result.stderr[:800])
            return None
        stdout = result.stdout.strip()
        for line in reversed(stdout.split("\n")):
            line = line.strip()
            if line.startswith("{"):
                return json.loads(line)
        return json.loads(stdout)
    except json.JSONDecodeError as e:
        print("JSON parse error:", e)
        print("Raw stdout:", stdout[:600])
        return None
    finally:
        os.unlink(tmp)


def load_seed_data():
    """优先读缓存 JSON；没有则现场抽取并写回。"""
    if os.path.exists(SEED_JSON):
        with open(SEED_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    if not NODE:
        print("[seed] 无 Node 且缺少 seed_data.json，无法抽取。请本地先生成。")
        return None
    data = extract_vars(HTML_PATH)
    if data:
        with open(SEED_JSON, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("[seed] 已从 index.html 抽取并缓存到 seed_data.json")
    return data


def seed_words(db, words):
    count = 0
    for w in words:
        existing = db.query(Word).filter(Word.word == w.get("word", "")).first()
        if not existing:
            db.add(Word(
                word=w.get("word", ""),
                phonetic=w.get("phonetic", ""),
                meaning=w.get("meaning", ""),
                cat=w.get("cat", "finance"),
                example=w.get("example", ""),
            ))
            count += 1
    db.commit()
    print(f"Words: {count} imported ({len(words)} total in source)")


def seed_dialogues(db, dialogues):
    count = 0
    for d in dialogues:
        existing = db.query(Dialogue).filter(Dialogue.id == d.get("id", "")).first()
        if not existing:
            db.add(Dialogue(
                id=d.get("id", ""),
                scene=d.get("scene", ""),
                desc=d.get("desc", ""),
                body=d.get("body", []),
                keywords=d.get("keywords", []),
                cat=d.get("cat", "biz"),
                level=d.get("level", "B1"),
                stage=d.get("stage", 1),
                stage_order=d.get("stage_order", 1) or d.get("order", 1),
            ))
            count += 1
    db.commit()
    print(f"Dialogues: {count} imported ({len(dialogues)} total in source)")


def seed_resources(db, resources):
    """resources 是 RECOMMEND_POOL 的数组格式，每项有 type/tag/url 等字段"""
    count = 0
    for item in resources:
        existing = db.query(Resource).filter(Resource.url == item.get("url", "")).first()
        if not existing:
            db.add(Resource(
                name=item.get("title", ""),
                desc=item.get("desc", ""),
                url=item.get("url", ""),
                cat=item.get("type", item.get("tag", "video")),
                src=item.get("src", "official"),
                icon="📺" if item.get("type") == "video" else "🎧" if item.get("type") == "podcast" else "🔗",
            ))
            count += 1
    db.commit()
    print(f"Resources: {count} imported")


def run_seed():
    init_db()
    db = SessionLocal()
    try:
        data = load_seed_data()
        if not data or "error" in data:
            print("[seed] 抽取失败，跳过")
            return
        print(f"[seed] words={len(data.get('words',[]))} dialogues={len(data.get('dialogues',[]))} resources={len(data.get('resources',[]))}")
        seed_words(db, data.get("words", []))
        seed_resources(db, data.get("resources", []))
        # 对话不再自动播种（从 PDF 导入/管理后台添加）
        print("[seed] done")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
