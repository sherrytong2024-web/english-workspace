const app = getApp();
const stateLib = require('../../utils/state.js');

Page({
  data: {
    dailyWords: [], doneCount: 0, dailyTotal: 0,
    total: 0, mastered: 0, learnedDialogs: 0, logCount: 0,
    recommend: [], recent: []
  },
  onShow: function () {
    this.state = app.state;
    this.render();
  },
  render: function () {
    const s = this.state;
    stateLib.ensureDailyWords(s);
    const dw = s.dailyWords[0];
    const done = dw ? dw.words.filter(function (w) { return w.done; }).length : 0;
    const recommend = stateLib.getTodayRecommend(s).slice(0, 3);
    this.setData({
      dailyWords: dw ? dw.words : [],
      doneCount: done,
      dailyTotal: dw ? dw.words.length : 0,
      total: s.words.length,
      mastered: s.reviewState.mastered.length,
      learnedDialogs: s.learnedDialogs.length,
      logCount: s.log.length,
      recommend: recommend,
      recent: s.log.slice(0, 5)
    });
  },
  goPage: function (e) {
    const key = e.currentTarget.dataset.key;
    wx.redirectTo({ url: '/pages/' + key + '/index' });
  },
  toggleDailyWord: function (e) {
    const word = e.currentTarget.dataset.word;
    const s = this.state;
    const today = stateLib.todayStr();
    const key = today + ':' + word;
    const idx = s.completedDailyWords.indexOf(key);
    if (idx >= 0) s.completedDailyWords.splice(idx, 1);
    else s.completedDailyWords.push(key);
    stateLib.ensureDailyWords(s);
    app.saveState();
    this.render();
  },
  logDailyWords: function () {
    const s = this.state;
    const today = stateLib.todayStr();
    if (s.dailyWords[0]) {
      s.dailyWords[0].words.forEach(function (w) {
        const k = today + ':' + w.word;
        if (s.completedDailyWords.indexOf(k) < 0) s.completedDailyWords.push(k);
      });
    }
    stateLib.logActivity(s, { type: 'daily', text: '完成今日单词 ' + (s.dailyWords[0] ? s.dailyWords[0].words.length : 0) + ' 个' });
    app.saveState();
    wx.showToast({ title: '已标记完成', icon: 'success' });
    this.render();
  },
  openRecommend: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.setClipboardData({ data: url, success: function () { wx.showToast({ title: '链接已复制', icon: 'none' }); } });
  }
});
