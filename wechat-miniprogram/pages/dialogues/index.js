var app = getApp();
var store = require('../../utils/store.js');
var api = require('../../utils/api.js');

var catMap = { finance: '金融职场', biz: '商业会议', daily: '日常', travel: '旅游' };
var catClsMap = { finance: 'fin', biz: 'biz', daily: 'daily', travel: 'travel' };
var catSelectKeys = ['all', 'finance', 'biz', 'daily', 'travel'];
var catSelectNames = ['全部', '金融职场', '商业会议', '日常', '旅游'];
var stageColors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

Page({
  data: {
    dailyDialogs: [],
    allDialogues: [],
    stages: [],
    countOptions: ['1', '2', '3'],
    ddCountIdx: 0,
    catSelectNames: catSelectNames,
    ddCatIdx: 0
  },

  onLoad: function () {
    var self = this;
    app.onReady(function () { self.render(); });
  },

  onShow: function () {
    if (app.state) this.render();
  },

  render: function () {
    var s = app.state;
    var dp = s.dialogPrefs || { count: 2, cat: 'all' };
    var countIdx = Math.min(Math.max((dp.count || 2) - 1, 0), 2);
    var catIdx = catSelectKeys.indexOf(dp.cat || 'all');
    if (catIdx < 0) catIdx = 0;
    this.setData({ ddCountIdx: countIdx, ddCatIdx: catIdx });
    this.renderDailyDialogs();
    this.renderDialogs();
  },

  /* ===== 今日对话 ===== */
  renderDailyDialogs: function () {
    var s = app.state;
    var dp = s.dialogPrefs || { count: 2, cat: 'all' };
    var count = dp.count || 2;
    var cat = dp.cat || 'all';
    var all = s.allDialogues || [];
    var pool = cat === 'all' ? all : all.filter(function (d) { return d.cat === cat; });
    var today = app.todayStr();
    var seed = parseInt(today.replace(/-/g, ''), 10);
    var learned = s.learnedDialogs || [];

    var dialogs = [];
    var seen = {};
    for (var i = 0; i < count && i < pool.length; i++) {
      var idx = (seed + i * 7) % pool.length;
      var d = pool[idx];
      if (!seen[d.id]) { seen[d.id] = true; dialogs.push(d); }
    }

    this.setData({
      dailyDialogs: dialogs.map(function (d) {
        return {
          id: d.id,
          scene: d.scene || '',
          cat: d.cat,
          catName: catMap[d.cat] || d.cat || '',
          catCls: catClsMap[d.cat] || 'pro',
          level: d.level || '',
          desc: d.desc || '',
          body: d.body || [],
          learned: learned.indexOf(d.id) >= 0
        };
      })
    });
  },

  /* ===== 全部对话分组 ===== */
  renderDialogs: function () {
    var s = app.state;
    var all = (s.allDialogues || []).slice().sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
    var learned = s.learnedDialogs || [];

    // 动态阶段分组
    var stageMap = {};
    all.forEach(function (d) {
      var st = d.stage || '其他';
      if (!stageMap[st]) stageMap[st] = { name: st, dialogues: [], minOrder: 9999 };
      stageMap[st].dialogues.push(d);
      if ((d.order || 99) < stageMap[st].minOrder) stageMap[st].minOrder = d.order || 99;
    });
    var dynamicStages = Object.values(stageMap).sort(function (a, b) { return a.minOrder - b.minOrder; });

    var stages = dynamicStages.map(function (stg, si) {
      return {
        name: stg.name,
        color: stageColors[si % stageColors.length],
        dialogues: stg.dialogues.map(function (d) {
          return {
            id: d.id,
            scene: d.scene || '',
            cat: d.cat,
            catName: catMap[d.cat] || d.cat || '',
            catCls: catClsMap[d.cat] || 'pro',
            level: d.level || '',
            desc: d.desc || '',
            body: d.body || [],
            keywords: d.keywords || [],
            learned: learned.indexOf(d.id) >= 0,
            expanded: false
          };
        })
      };
    });

    this.setData({
      allDialogues: all,
      stages: stages
    });
  },

  /* ===== 交互 ===== */
  toggleDialogBody: function (e) {
    var id = e.currentTarget.dataset.id;
    var stages = this.data.stages;
    var found = false;
    stages.forEach(function (stg) {
      stg.dialogues.forEach(function (d) {
        if (d.id === id) { d.expanded = !d.expanded; found = true; }
      });
    });
    if (found) this.setData({ stages: stages });
  },

  toggleLearned: function (e) {
    var id = e.currentTarget.dataset.id;
    var s = app.state;
    var learned = s.learnedDialogs || [];
    if (learned.indexOf(id) >= 0) {
      s.learnedDialogs = learned.filter(function (x) { return x !== id; });
    } else {
      s.learnedDialogs.push(id);
      var dl = (s.allDialogues || []).find(function (x) { return x.id === id; });
      if (dl) app.addLog('dialog', '学习对话: ' + (dl.scene || ''));
    }
    app.saveState();
    app.syncProgress();
    this.render();
  },

  copyDialog: function (e) {
    var id = e.currentTarget.dataset.id;
    var d = (app.state.allDialogues || []).find(function (x) { return x.id === id; });
    if (!d) return;
    var txt = (d.scene || '') + '\n\n' +
      (d.body || []).map(function (l) { return l.s + ': ' + (l.t || '').replace(/<[^>]+>/g, ''); }).join('\n');
    wx.setClipboardData({
      data: txt,
      success: function () { wx.showToast({ title: '已复制到剪贴板', icon: 'none' }); }
    });
  },

  /* ===== 设置 ===== */
  onCountChange: function (e) {
    var idx = parseInt(e.detail.value);
    app.state.dialogPrefs.count = idx + 1;
    app.saveState();
    app.syncProgress();
    this.render();
  },

  onCatChange: function (e) {
    var idx = parseInt(e.detail.value);
    app.state.dialogPrefs.cat = catSelectKeys[idx];
    app.saveState();
    app.syncProgress();
    this.render();
  },

  refreshDailyDialogs: function () {
    this.renderDailyDialogs();
    wx.showToast({ title: '已刷新', icon: 'none' });
  }
});
