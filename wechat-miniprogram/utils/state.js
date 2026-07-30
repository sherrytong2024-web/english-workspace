// 状态管理 / 数据容错 / 每日单词 / 推荐逻辑（小程序版）
const DATA = require('./data.js');
const SEED_WORDS = DATA.SEED_WORDS;
const SEED_DIALOGS = DATA.SEED_DIALOGS;
const RECOMMEND_POOL = DATA.RECOMMEND_POOL;
const CATS = DATA.CATS;

// 分类名/样式（从 CATS 派生）
const catName = {};
const catCls = {};
Object.keys(CATS).forEach(function (k) {
  catName[k] = CATS[k].name;
  catCls[k] = CATS[k].cls;
});

// 对话阶段
const stageName = {
  1: '阶段一 · 实习面试',
  2: '阶段二 · 日常基础',
  3: '阶段三 · 旅游出行',
  4: '阶段四 · 职场协作',
  5: '阶段五 · 客户与路演',
  6: '阶段六 · 高阶金融'
};
const stageColors = {
  1: '#3b82f6',
  2: '#10b981',
  3: '#f59e0b',
  4: '#8b5cf6',
  5: '#ef4444',
  6: '#0ea5e9'
};

function todayStr() {
  const d = new Date();
  const m = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
  const day = (d.getDate() < 10 ? '0' : '') + d.getDate();
  return d.getFullYear() + '-' + m + '-' + day;
}

function defaultState() {
  return {
    words: SEED_WORDS.map(function (w) {
      return Object.assign({}, w, { example: w.example || '' });
    }),
    reviewState: { mastered: [], familiar: [] },
    prefs: { cat: 'all' },
    dailyWords: [],
    completedDailyWords: [],
    dialogPrefs: { count: 2, cat: 'all' },
    learnedDialogs: [],
    log: []
  };
}

// 容错：兼容任何旧/坏数据，非法字段重置为默认
function sanitizeState(s) {
  if (!s || typeof s !== 'object') s = {};
  const d = defaultState();
  ['words', 'dailyWords', 'completedDailyWords', 'learnedDialogs', 'log'].forEach(function (k) {
    if (!Array.isArray(s[k])) s[k] = d[k];
  });
  if (!s.reviewState || typeof s.reviewState !== 'object') s.reviewState = { mastered: [], familiar: [] };
  if (!Array.isArray(s.reviewState.mastered)) s.reviewState.mastered = [];
  if (!Array.isArray(s.reviewState.familiar)) s.reviewState.familiar = [];
  if (!s.prefs || typeof s.prefs !== 'object') s.prefs = { cat: 'all' };
  if (typeof s.prefs.cat !== 'string') s.prefs.cat = 'all';
  if (!s.dialogPrefs || typeof s.dialogPrefs !== 'object') s.dialogPrefs = { count: 2, cat: 'all' };
  if (typeof s.dialogPrefs.count !== 'number' || s.dialogPrefs.count < 1) s.dialogPrefs.count = 2;
  if (typeof s.dialogPrefs.cat !== 'string') s.dialogPrefs.cat = 'all';
  if (s.words.length && typeof s.words[0] !== 'object') s.words = d.words;
  ensureDailyWords(s);
  return s;
}

// 确保每日单词始终按当天生成，进度沿用 completedDailyWords
function ensureDailyWords(s) {
  const today = todayStr();
  if (
    s.dailyWords &&
    s.dailyWords.length &&
    s.dailyWords[0].date === today &&
    s.dailyWords[0].words &&
    s.dailyWords[0].words.length
  ) {
    s.dailyWords[0].words.forEach(function (w) {
      w.done = s.completedDailyWords.indexOf(today + ':' + w.word) >= 0;
    });
    return;
  }
  if (!s.words.length) {
    s.dailyWords = [];
    return;
  }
  const daySeed = parseInt(today.replace(/-/g, ''), 10) % s.words.length;
  const shuffled = s.words.slice().sort(function (a, b) {
    const ha = (daySeed + a.word.charCodeAt(0)) % s.words.length;
    const hb = (daySeed + b.word.charCodeAt(0)) % s.words.length;
    return ha - hb;
  });
  s.dailyWords = [
    {
      date: today,
      words: shuffled.slice(0, 10).map(function (w) {
        return {
          word: w.word,
          meaning: w.meaning,
          phonetic: w.phonetic,
          cat: w.cat,
          example: w.example,
          done: s.completedDailyWords.indexOf(today + ':' + w.word) >= 0
        };
      })
    }
  ];
}

// 每日推荐：基于偏好分类 + 日期轮换
function getTodayRecommend(s, offset) {
  offset = offset || 0;
  const pool = RECOMMEND_POOL || [];
  let filtered = pool;
  if (s.prefs && s.prefs.cat && s.prefs.cat !== 'all') {
    const f = pool.filter(function (r) {
      return r && r.cat === s.prefs.cat;
    });
    if (f.length) filtered = f;
  }
  if (!filtered.length) filtered = pool;
  const today = todayStr();
  const seed = (parseInt(today.replace(/-/g, ''), 10) + offset) % Math.max(1, filtered.length);
  const arr = [];
  const n = Math.min(6, filtered.length);
  for (let i = 0; i < n; i++) {
    arr.push(filtered[(seed + i) % filtered.length]);
  }
  return arr;
}

function logActivity(s, entry) {
  entry.t = entry.t || todayStr() + ' ' + (function () {
    const d = new Date();
    return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  })();
  s.log.unshift(entry);
  if (s.log.length > 500) s.log = s.log.slice(0, 500);
}

module.exports = {
  catName: catName,
  catCls: catCls,
  stageName: stageName,
  stageColors: stageColors,
  todayStr: todayStr,
  defaultState: defaultState,
  sanitizeState: sanitizeState,
  ensureDailyWords: ensureDailyWords,
  getTodayRecommend: getTodayRecommend,
  logActivity: logActivity
};
