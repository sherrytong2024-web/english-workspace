var app = getApp();
var DATA = require('../../utils/data.js');
var RESOURCES = DATA.RESOURCES || {};

var catCfg = [
  { key: 'video', label: '财经视频', icon: '📺', collapsed: false },
  { key: 'podcast', label: '英语学习播客', icon: '🎧', collapsed: true },
  { key: 'dict', label: '词典 & 学习工具', icon: '📚', collapsed: true },
  { key: 'biz', label: '职场 & 商业内容', icon: '💼', collapsed: true },
  { key: 'news', label: '每日新闻 & 市场', icon: '📰', collapsed: true }
];

var curSearch = '';

Page({
  data: {
    searchText: '',
    categories: []
  },

  onLoad: function () {
    var self = this;
    app.onReady(function () { self.render(); });
  },

  onShow: function () {
    if (app.state) this.render();
  },

  render: function () {
    this.filterResources(curSearch);
  },

  filterResources: function (search) {
    curSearch = search || '';
    var s = curSearch.toLowerCase();
    var favs = app.state.favorites || [];

    function filter(arr) {
      if (!arr) return [];
      return arr.filter(function (r) {
        return !s || (r.name || '').toLowerCase().indexOf(s) >= 0 || (r.desc || '').toLowerCase().indexOf(s) >= 0;
      });
    }

    var cats = catCfg.map(function (c) {
      var items = filter(RESOURCES[c.key] || []).map(function (r) {
        return {
          name: r.name, src: r.src, desc: r.desc, url: r.url, cat: r.cat,
          faved: favs.some(function (f) { return f.name === r.name; })
        };
      });
      return { key: c.key, label: c.label, icon: c.icon, collapsed: c.collapsed, items: items };
    });

    this.setData({ categories: cats, searchText: curSearch });
  },

  onSearch: function (e) {
    this.filterResources(e.detail.value);
  },

  toggleCat: function (e) {
    var key = e.currentTarget.dataset.key;
    var cfg = catCfg.find(function (c) { return c.key === key; });
    if (cfg) cfg.collapsed = !cfg.collapsed;
    this.filterResources(curSearch);
  },

  toggleFav: function (e) {
    var name = e.currentTarget.dataset.name;
    var url = e.currentTarget.dataset.url;
    var favs = app.state.favorites || [];

    if (favs.some(function (f) { return f.name === name; })) {
      app.state.favorites = favs.filter(function (f) { return f.name !== name; });
    } else {
      favs.push({ name: name, url: url });
      app.addLog('fav', '收藏资源: ' + name);
    }
    app.saveState();
    app.syncProgress();
    this.filterResources(curSearch);
    wx.showToast({ title: favs.some(function (f) { return f.name === name; }) ? '已收藏' : '已取消', icon: 'none' });
  },

  copyLink: function (e) {
    var url = e.currentTarget.dataset.url;
    wx.setClipboardData({
      data: url,
      success: function () { wx.showToast({ title: '链接已复制', icon: 'none' }); }
    });
  }
});
