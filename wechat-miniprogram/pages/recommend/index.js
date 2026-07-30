const app = getApp();
const stateLib = require('../../utils/state.js');

Page({
  data: { list: [], cats: [], prefsCat: 'all', seed: 0 },
  onShow: function () {
    this.state = app.state;
    this.render();
  },
  render: function () {
    const s = this.state;
    const list = stateLib.getTodayRecommend(s, this.data.seed);
    const cats = Object.keys(stateLib.catName).map(function (k) {
      return { key: k, name: stateLib.catName[k] };
    });
    this.setData({ list: list, cats: cats, prefsCat: s.prefs.cat });
  },
  setCat: function (e) {
    const cat = e.currentTarget.dataset.cat;
    this.state.prefs.cat = cat;
    app.saveState();
    this.setData({ seed: 0, prefsCat: cat });
    this.render();
  },
  changeBatch: function () {
    this.setData({ seed: this.data.seed + Math.floor(Math.random() * 100) + 1 });
    this.render();
  },
  openLink: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.setClipboardData({ data: url, success: function () { wx.showToast({ title: '链接已复制', icon: 'none' }); } });
  }
});
