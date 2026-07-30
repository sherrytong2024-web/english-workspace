const RECOMMEND_POOL = require('../../utils/data.js').RECOMMEND_POOL;
const NAMES = { video: '📺 财经视频', podcast: '🎧 学习播客', dict: '📚 词典工具', biz: '💼 职场商业', news: '📰 新闻市场' };
const ORDER = ['video', 'podcast', 'dict', 'biz', 'news'];

Page({
  data: { cats: [], collapsed: {} },
  onShow: function () { this.render(); },
  render: function () {
    const map = {};
    RECOMMEND_POOL.forEach(function (r) {
      let c = r.cat || 'news';
      if (ORDER.indexOf(c) < 0) c = 'news';
      (map[c] = map[c] || []).push(r);
    });
    const cats = ORDER.filter(function (c) { return map[c] && map[c].length; }).map(function (c) {
      return { key: c, name: NAMES[c] || c, list: map[c] };
    });
    const collapsed = {};
    cats.forEach(function (c, i) { collapsed[c.key] = i !== 0; });
    this.setData({ cats: cats, collapsed: collapsed });
  },
  toggleCat: function (e) {
    const k = e.currentTarget.dataset.k;
    const collapsed = Object.assign({}, this.data.collapsed);
    collapsed[k] = !collapsed[k];
    this.setData({ collapsed: collapsed });
  },
  openLink: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.setClipboardData({ data: url, success: function () { wx.showToast({ title: '链接已复制', icon: 'none' }); } });
  }
});
