const store = require('./utils/store.js');
const api = require('./utils/api.js');

App({
  state: null,
  onLaunch: function () {
    // 从本地恢复基础状态（对话标记、单词进度等）
    let local = store.load('state', {});
    this.state = {
      words: local.words || [],
      allDialogues: local.allDialogues || [],
      resources: local.resources || [],
      learnedDialogs: local.learnedDialogs || [],
      completedDailyWords: local.completedDailyWords || [],
      dailyWords: local.dailyWords || [],
      reviewState: local.reviewState || { mastered: [], familiar: [] },
      dialogPrefs: local.dialogPrefs || { count: 2, cat: 'all' },
      log: local.log || []
    };

    // 从线上拉取全量数据
    this.fetchData();
  },

  async fetchData() {
    try {
      // 拉对话
      const dialogues = await api.getDialogues();
      if (Array.isArray(dialogues)) {
        this.state.allDialogues = dialogues.map(function (d) {
          d.order = d.stage_order || d.order || 99;
          return d;
        });
      }
    } catch (e) { console.warn('dialogues fetch fail', e); }

    try {
      // 单词从线上拉（仅内置词库）
      const words = await api.getWords();
      if (Array.isArray(words) && words.length) {
        this.state.words = words;
      }
    } catch (e) { console.warn('words fetch fail', e); }

    try {
      // 进度
      const prog = await api.getProgress('default');
      if (prog) {
        if (Array.isArray(prog.learned_dialogues)) this.state.learnedDialogs = prog.learned_dialogues;
        if (Array.isArray(prog.completed_daily_words)) this.state.completedDailyWords = prog.completed_daily_words;
        if (Array.isArray(prog.mastered_words)) this.state.reviewState.mastered = prog.mastered_words;
      }
    } catch (e) { console.warn('progress fetch fail', e); }

    try {
      // 资源
      const resources = await api.getResources();
      if (Array.isArray(resources)) this.state.resources = resources;
    } catch (e) { console.warn('resources fetch fail', e); }

    this.saveState();
    this.emitReady();
  },

  saveState: function () {
    store.save('state', {
      learnedDialogs: this.state.learnedDialogs,
      completedDailyWords: this.state.completedDailyWords,
      dailyWords: this.state.dailyWords,
      reviewState: this.state.reviewState,
      dialogPrefs: this.state.dialogPrefs,
      log: this.state.log
    });
  },

  _readyCallbacks: [],
  onReady: function (cb) { this._readyCallbacks.push(cb); },
  emitReady: function () {
    var self = this;
    this._readyCallbacks.forEach(function (cb) { cb(); });
    this._readyCallbacks = [];
  }
});
