var app = getApp();
var catMap = { finance: '金融职场', biz: '商业会议', daily: '日常', travel: '旅游' };
var catClsMap = { finance: 'fin', biz: 'biz', daily: 'daily', travel: 'travel' };
var catTagCls = { finance: 'fin', professional: 'pro', daily: 'daily', travel: 'travel', academic: 'pro' };
var catTagName = { finance: '金融', professional: '职场', daily: '日常', travel: '旅游', academic: '学术' };

Page({
  data: {
    reviewTab: 'word',
    reviewDialogCount: 0,
    reviewDialogs: [],
    // 闪卡
    reviewWord: null,
    reviewIdx: 0,
    reviewTotal: 0,
    totalWords: 0,
    flipped: false,
    reviewProgress: 0,
    masteredCount: 0,
    completedTotal: 0
  },

  onLoad: function () {
    var self = this;
    app.onReady(function () { self.render(); });
  },

  onShow: function () {
    if (app.state) this.render();
  },

  render: function () {
    this.renderReview();
    this.renderReviewDialogs();
  },

  /* ===== 单词闪卡 ===== */
  renderReview: function () {
    var s = app.state;
    // 只复习用户实际完成过的每日��词
    var completedWords = [];
    (s.completedDailyWords || []).forEach(function (k) {
      var i = k.indexOf(':');
      var w = i >= 0 ? k.slice(i + 1) : k;
      if (completedWords.indexOf(w) < 0) completedWords.push(w);
    });

    var mastered = s.reviewState.mastered || [];
    var unmastered = (s.words || []).filter(function (w) {
      return completedWords.indexOf(w.word) >= 0 && mastered.indexOf(w.word) < 0;
    });

    if (!unmastered.length) {
      this.setData({
        reviewWord: null,
        reviewTotal: 0,
        totalWords: (s.words || []).length,
        masteredCount: mastered.length,
        completedTotal: completedWords.length,
        reviewProgress: 0
      });
      return;
    }

    var idx = (s.reviewState.idx || 0) % unmastered.length;
    var w = unmastered[idx];

    this.setData({
      reviewWord: {
        word: w.word,
        phonetic: w.phonetic || '',
        meaning: w.meaning || '',
        example: w.example || '',
        catCls: catTagCls[w.cat] || 'pro',
        catName: catTagName[w.cat] || w.cat || ''
      },
      reviewIdx: idx,
      reviewTotal: unmastered.length,
      totalWords: (s.words || []).length,
      flipped: false,
      reviewProgress: mastered.length / Math.max(1, mastered.length + completedWords.length) * 100,
      masteredCount: mastered.length,
      completedTotal: completedWords.length
    });
  },

  flipCard: function () {
    this.setData({ flipped: !this.data.flipped });
  },

  nextCard: function () {
    app.state.reviewState.idx = (app.state.reviewState.idx || 0) + 1;
    app.saveState();
    this.renderReview();
  },

  prevCard: function () {
    app.state.reviewState.idx = Math.max(0, (app.state.reviewState.idx || 0) - 1);
    app.saveState();
    this.renderReview();
  },

  markMasteredCard: function () {
    var w = this.data.reviewWord;
    if (!w) return;
    var mastered = app.state.reviewState.mastered;
    if (mastered.indexOf(w.word) < 0) {
      mastered.push(w.word);
      app.addLog('review', '复习掌���: ' + w.word);
    }
    app.saveState();
    app.syncProgress();
    this.nextCard();
    wx.showToast({ title: '已标记掌握', icon: 'none' });
  },

  /* ===== 对话复习 ===== */
  renderReviewDialogs: function () {
    var s = app.state;
    var learned = s.learnedDialogs || [];
    this.setData({ reviewDialogCount: learned.length });

    if (!learned.length) {
      this.setData({ reviewDialogs: [] });
      return;
    }

    var list = (s.allDialogues || []).filter(function (d) { return learned.indexOf(d.id) >= 0; });
    this.setData({
      reviewDialogs: list.map(function (d) {
        return {
          id: d.id,
          scene: d.scene || '',
          catName: catMap[d.cat] || d.cat || '',
          catCls: catClsMap[d.cat] || 'pro',
          level: d.level || '',
          desc: d.desc || '',
          body: d.body || []
        };
      })
    });
  },

  removeFromReview: function (e) {
    var id = e.currentTarget.dataset.id;
    app.state.learnedDialogs = (app.state.learnedDialogs || []).filter(function (x) { return x !== id; });
    app.saveState();
    app.syncProgress();
    this.renderReviewDialogs();
    wx.showToast({ title: '已移出复习', icon: 'none' });
  },

  setTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ reviewTab: tab });
    if (tab === 'word') this.renderReview();
    if (tab === 'dialog') this.renderReviewDialogs();
  }
});
