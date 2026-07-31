var app = getApp();
var api = require('../../utils/api.js');

var _allSources = null;

Page({
  data: {
    greeting: '',
    todayDate: '',
    statWords: 0,
    statDialogs: 0,
    statDays: 0,
    statFavs: 0,
    weeklyActivity: [],
    recType: '',
    recIcon: '',
    recTitle: '',
    recMeta: '',
    dwDone: 0,
    dwTotal: 0
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
    var h = new Date().getHours();
    var greeting = h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';

    var d = new Date();
    var wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    var todayDate = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + wk;

    // 本周活动
    var week = [];
    for (var i = 6; i >= 0; i--) {
      var dt = new Date();
      dt.setDate(dt.getDate() - i);
      var ds = dt.getFullYear() + '-' +
        (dt.getMonth() + 1 < 10 ? '0' : '') + (dt.getMonth() + 1) + '-' +
        (dt.getDate() < 10 ? '0' : '') + dt.getDate();
      var cnt = (s.log || []).filter(function (l) { return l.t && l.t.startsWith(ds); }).length;
      week.push({ date: ds.slice(5), count: cnt });
    }

    // 本周学习天数
    var days = {};
    (s.log || []).forEach(function (l) {
      if (l.t) days[l.t.slice(0, 10)] = true;
    });

    // 今日单词统计
    var allDw = (s.dailyWords || []).reduce(function (a, g) { return a.concat(g.words || []); }, []);
    var dwDone = allDw.filter(function (w) { return w.done; }).length;
    var dwTotal = allDw.length;

    this.setData({
      greeting: greeting,
      todayDate: todayDate,
      statWords: (s.words || []).length,
      statDialogs: (s.learnedDialogs || []).length,
      statDays: Object.keys(days).length,
      statFavs: (s.favorites || []).length,
      weeklyActivity: week,
      recType: 'link',
      recIcon: '\ud83d\udcc5',
      recTitle: '每日推荐已就绪',
      recMeta: '云端',
      dwDone: dwDone,
      dwTotal: dwTotal
    });
  },

  goRecommend: function () {
    wx.redirectTo({ url: '/pages/recommend/index' });
  },

  goWords: function () {
    wx.redirectTo({ url: '/pages/words/index' });
  },

  goLog: function () {
    wx.redirectTo({ url: '/pages/log/index' });
  }
});
