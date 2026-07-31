var app = getApp();
var api = require('../../utils/api.js');

var months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
var weekdays = ['日', '一', '二', '三', '四', '五', '六'];

var overviewMonth = new Date().getMonth();
var overviewYear = new Date().getFullYear();
var motivation = null;

Page({
  data: {
    monthLabel: '',
    calTitle: '',
    weekdays: weekdays,
    calRows: [],
    streak: 0,
    motivationText: '加载中...',
    motivationAuthor: '',
    dayDetail: false,
    dayDetailTitle: '',
    dayDetailItems: []
  },

  onLoad: function () {
    var self = this;
    overviewMonth = new Date().getMonth();
    overviewYear = new Date().getFullYear();
    app.onReady(function () { self.render(); });
  },

  onShow: function () {
    if (app.state) this.render();
  },

  render: function () {
    var m = overviewMonth, y = overviewYear;
    this.setData({
      monthLabel: y + ' ' + months[m],
      calTitle: y + '年' + months[m]
    });
    this.renderMotivation();
    this.renderCalendar();
  },

  renderMotivation: function () {
    var self = this;
    if (motivation) {
      this.setData({ motivationText: motivation.text || '', motivationAuthor: motivation.author ? '— ' + motivation.author : '' });
      return;
    }
    api.getMotivation().then(function (q) {
      motivation = q;
      self.setData({ motivationText: q.text || '', motivationAuthor: q.author ? '— ' + q.author : '' });
    }).catch(function () {
      self.setData({ motivationText: 'Learning is a treasure that will follow its owner everywhere.', motivationAuthor: '— Chinese Proverb' });
    });
  },

  renderCalendar: function () {
    var self = this;
    var m = overviewMonth, y = overviewYear;
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = new Date();
    var todayStr = app.todayStr();

    // 连续学习天数
    var log = app.state.log;
    var streak = 0;
    var d = new Date();
    while (true) {
      var ds = d.getFullYear() + '-' +
        (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + '-' +
        (d.getDate() < 10 ? '0' : '') + d.getDate();
      if (log.some(function (l) { return l.t && l.t.startsWith(ds); })) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }

    var rows = [];
    var row = [];
    for (var i = 0; i < firstDay; i++) { row.push({}); }

    for (var day = 1; day <= daysInMonth; day++) {
      var ds = y + '-' + (m + 1 < 10 ? '0' : '') + (m + 1) + '-' + (day < 10 ? '0' : '') + day;
      var hasActivity = log.some(function (l) { return l.t && l.t.startsWith(ds); });
      var isToday = ds === todayStr;
      var cell = {
        day: day,
        ds: ds,
        bg: hasActivity ? '#dbeafe' : (isToday ? '#fef3c7' : '#f9fafb'),
        border: isToday ? '2px solid #3b82f6' : (hasActivity ? '1px solid #93c5fd' : '1px solid #e2e8f0'),
        fw: isToday ? '700' : '400',
        tap: hasActivity
      };
      row.push(cell);
      if ((firstDay + day) % 7 === 0) { rows.push(row); row = []; }
    }
    if (row.length) { rows.push(row); }

    this.setData({ calRows: rows, streak: streak });
  },

  refreshMotivation: function () {
    motivation = null;
    this.renderMotivation();
  },

  prevMonth: function () {
    overviewMonth--;
    if (overviewMonth < 0) { overviewMonth = 11; overviewYear--; }
    this.render();
  },

  nextMonth: function () {
    overviewMonth++;
    if (overviewMonth > 11) { overviewMonth = 0; overviewYear++; }
    this.render();
  },

  showDayDetail: function (e) {
    var ds = e.currentTarget.dataset.ds;
    var items = (app.state.log || []).filter(function (l) { return l.t && l.t.startsWith(ds); });
    var typeName = { word: '单词', dialog: '对话', fav: '收藏', recommend: '推荐', dailyword: '每日单词', review: '复习' };
    var tagClass = { word: 'daily', dialog: 'fin', fav: 'biz', recommend: 'pro', dailyword: 'daily', review: 'pro' };
    var d = new Date(ds);
    var label = ds + ' 周' + weekdays[d.getDay()] + ' (' + items.length + ' 项活动)';

    this.setData({
      dayDetail: true,
      dayDetailTitle: label,
      dayDetailItems: items.map(function (l) {
        return {
          cls: tagClass[l.type] || 'pro',
          typeName: typeName[l.type] || l.type,
          time: l.t ? l.t.slice(11) : '',
          content: l.content
        };
      })
    });
  }
});
