const store = require('./utils/store.js');
const api = require('./utils/api.js');

App({
  state: null,
  _readyCallbacks: [],

  onLaunch: function () {
    var self = this;
    // 从本地恢复基础状态
    var local = store.load('state', {});
    this.state = {
      words: local.words || [],
      allDialogues: local.allDialogues || [],
      learnedDialogs: local.learnedDialogs || [],
      favorites: local.favorites || [],
      log: local.log || [],
      reviewState: local.reviewState || { idx: 0, mastered: [] },
      prefs: local.prefs || { cat: 'all' },
      dailyWords: local.dailyWords || [],
      completedDailyWords: local.completedDailyWords || [],
      dialogPrefs: local.dialogPrefs || { count: 2, cat: 'all' }
    };

    // 异步从云端拉取全量数据
    this.fetchData().then(function () {
      self.emitReady();
    });
  },

  async fetchData() {
    var self = this;
    // 对话
    try {
      var dialogues = await api.getDialogues();
      if (Array.isArray(dialogues) && dialogues.length) {
        this.state.allDialogues = dialogues.map(function (d) {
          d.order = d.stage_order || d.order || 99;
          return d;
        });
      }
    } catch (e) { console.warn('dialogues fetch fail', e); }

    // 单词
    try {
      var words = await api.getWords();
      if (Array.isArray(words) && words.length) {
        this.state.words = words;
      }
    } catch (e) { console.warn('words fetch fail', e); }

    // 进度（含 favorites / prefs / dialogPrefs）
    try {
      var prog = await api.getProgress('default');
      if (prog) {
        if (Array.isArray(prog.learned_dialogues)) self.state.learnedDialogs = prog.learned_dialogues;
        if (Array.isArray(prog.completed_daily_words)) self.state.completedDailyWords = prog.completed_daily_words;
        if (Array.isArray(prog.mastered_words)) self.state.reviewState.mastered = prog.mastered_words;
        if (Array.isArray(prog.favorites)) self.state.favorites = prog.favorites;
        if (prog.prefs && typeof prog.prefs === 'object') self.state.prefs = Object.assign(self.state.prefs, prog.prefs);
        if (Array.isArray(prog.daily_words_data)) self.state.dailyWords = prog.daily_words_data;
        if (prog.dialog_prefs && typeof prog.dialog_prefs === 'object')
          self.state.dialogPrefs = Object.assign(self.state.dialogPrefs, prog.dialog_prefs);
      }
    } catch (e) { console.warn('progress fetch fail', e); }

    // 学习记录
    try {
      var logs = await api.getLogs('default');
      if (Array.isArray(logs)) {
        self.state.log = logs.map(function (l) {
          return { t: l.date + ' ' + (l.time || '00:00'), type: l.dtype || l.type, content: l.detail || l.content };
        });
      }
    } catch (e) { console.warn('logs fetch fail', e); }

    // 容错
    this.sanitizeState();
    this.ensureDailyWords();
    this.saveState();
  },

  sanitizeState: function () {
    var s = this.state;
    var arr = function (v) { return Array.isArray(v) ? v : []; };
    s.words = arr(s.words);
    s.allDialogues = arr(s.allDialogues);
    s.learnedDialogs = arr(s.learnedDialogs);
    s.favorites = arr(s.favorites);
    s.log = arr(s.log);
    s.completedDailyWords = arr(s.completedDailyWords);
    s.dailyWords = arr(s.dailyWords);
    if (!s.reviewState || typeof s.reviewState !== 'object') s.reviewState = { idx: 0, mastered: [] };
    s.reviewState.idx = s.reviewState.idx | 0;
    s.reviewState.mastered = arr(s.reviewState.mastered);
    if (!s.prefs || typeof s.prefs !== 'object') s.prefs = {};
    s.prefs.cat = arr(s.prefs.cat);
    if (!s.prefs.level) s.prefs.level = 'B2';
    if (!s.dialogPrefs || typeof s.dialogPrefs !== 'object') s.dialogPrefs = { count: 2, cat: 'all' };
  },

  ensureDailyWords: function () {
    var s = this.state;
    var today = this.todayStr();
    if (s.dailyWords.length && s.dailyWords[0].date === today) {
      s.dailyWords[0].words.forEach(function (w) {
        w.done = s.completedDailyWords.indexOf(today + ':' + w.word) >= 0;
      });
      return;
    }
    if (!s.words.length) { s.dailyWords = []; return; }
    var daySeed = parseInt(today.replace(/-/g, ''), 10) % s.words.length;
    var shuffled = s.words.slice().sort(function (a, b) {
      var ha = (daySeed + (a.word || '').charCodeAt(0)) % s.words.length;
      var hb = (daySeed + (b.word || '').charCodeAt(0)) % s.words.length;
      return ha - hb;
    });
    s.dailyWords = [{
      date: today,
      words: shuffled.slice(0, 10).map(function (w) {
        return {
          word: w.word, meaning: w.meaning, phonetic: w.phonetic,
          cat: w.cat, example: w.example,
          done: s.completedDailyWords.indexOf(today + ':' + w.word) >= 0
        };
      })
    }];
  },

  saveState: function () {
    store.save('state', {
      words: this.state.words,
      allDialogues: this.state.allDialogues,
      learnedDialogs: this.state.learnedDialogs,
      favorites: this.state.favorites,
      log: this.state.log,
      reviewState: this.state.reviewState,
      prefs: this.state.prefs,
      dailyWords: this.state.dailyWords,
      completedDailyWords: this.state.completedDailyWords,
      dialogPrefs: this.state.dialogPrefs
    });
  },

  // 云端同步进度（best-effort）
  syncProgress: function () {
    var s = this.state;
    api.putProgress('default', {
      mastered_words: s.reviewState.mastered,
      completed_daily_words: s.completedDailyWords,
      learned_dialogues: s.learnedDialogs,
      favorites: s.favorites,
      prefs: s.prefs,
      daily_words_data: s.dailyWords,
      dialog_prefs: s.dialogPrefs
    }).catch(function (e) { console.warn('sync fail', e); });
  },

  // 学习日志（本地 + 云端双写）
  addLog: function (type, content) {
    var entry = { t: this.nowStr(), type: type, content: content };
    this.state.log.unshift(entry);
    if (this.state.log.length > 500) this.state.log = this.state.log.slice(0, 500);
    store.save('log', this.state.log);
    // 异步同步云端
    api.postLog({ user_id: 'default', date: entry.t.slice(0, 10), time: entry.t.slice(11), dtype: type, detail: content })
      .catch(function (e) { console.warn('log sync fail', e); });
  },

  // 工具
  todayStr: function () {
    var d = new Date();
    var m = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
    var day = (d.getDate() < 10 ? '0' : '') + d.getDate();
    return d.getFullYear() + '-' + m + '-' + day;
  },
  nowStr: function () {
    return this.todayStr() + ' ' +
      (new Date().getHours() < 10 ? '0' : '') + new Date().getHours() + ':' +
      (new Date().getMinutes() < 10 ? '0' : '') + new Date().getMinutes();
  },
  toast: function (msg) {
    var scope = this;
    if (scope._toastTimer) clearTimeout(scope._toastTimer);
    scope._toastMsg = msg;
    scope._toastShow = true;
    // 避免过多 setData
    scope._toastTimer = setTimeout(function () {
      scope._toastShow = false;
      scope._toastTimer = null;
    }, 2000);
  },

  // ready 回调（页面 onLoad 时注册，数据就绪后重渲染）
  onReady: function (cb) { this._readyCallbacks.push(cb); },
  emitReady: function () {
    var self = this;
    this._readyCallbacks.forEach(function (cb) { cb(); });
    this._readyCallbacks = [];
  }
});
