var app = getApp();

var logFilterDate = '';

Page({
  data: {
    stats: { total: 0, words: 0, dialogs: 0, favs: 0 },
    filterDate: '',
    filterInfo: '',
    filteredLog: []
  },

  onLoad: function () {
    var self = this;
    app.onReady(function () { self.render(); });
  },

  onShow: function () {
    if (app.state) this.render();
  },

  render: function () {
    var log = app.state.log || [];
    this.setData({
      stats: {
        total: log.length,
        words: log.filter(function (l) { return l.type === 'word'; }).length,
        dialogs: log.filter(function (l) { return l.type === 'dialog'; }).length,
        favs: log.filter(function (l) { return l.type === 'fav'; }).length
      }
    });
    this.filterLog();
  },

  filterLog: function () {
    var log = app.state.log || [];
    var filtered = log;
    if (logFilterDate) {
      filtered = log.filter(function (l) { return l.t && l.t.startsWith(logFilterDate); });
    }

    var typeName = { word: '单词', dialog: '对话', fav: '收藏', recommend: '推荐', dailyword: '每日单词', review: '复习' };
    var tagClass = { word: 'daily', dialog: 'fin', fav: 'biz', recommend: 'pro', dailyword: 'daily', review: 'pro' };

    this.setData({
      filterInfo: logFilterDate
        ? '显示 ' + logFilterDate + ' 的记录 (' + filtered.length + ' 条)'
        : '显示全部 (' + filtered.length + ' 条)',
      filteredLog: filtered.map(function (l) {
        return {
          t: l.t || '',
          cls: tagClass[l.type] || 'pro',
          typeName: typeName[l.type] || l.type,
          content: l.content || ''
        };
      })
    });
  },

  onDateFilter: function (e) {
    logFilterDate = e.detail.value;
    this.setData({ filterDate: logFilterDate });
    this.filterLog();
  },

  resetFilter: function () {
    logFilterDate = '';
    this.setData({ filterDate: '' });
    this.filterLog();
  },

  clearLog: function () {
    var self = this;
    wx.showModal({
      title: '确认清空',
      content: '确定清空所有学习记录？此操作不可恢复',
      success: function (res) {
        if (res.confirm) {
          app.state.log = [];
          app.saveState();
          self.render();
          wx.showToast({ title: '已清空', icon: 'none' });
        }
      }
    });
  }
});
