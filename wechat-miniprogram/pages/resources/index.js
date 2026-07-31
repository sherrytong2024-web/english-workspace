const app = getApp();

Page({
  data: { cats: [], collapsed: {}, loading: true },
  onShow: function () {
    this.state = app.state;
    app.onReady(() => { this.state = app.state; this.render(); });
    if (this.state.resources && this.state.resources.length) this.render();
  },
  render: function () {
    const all = this.state.resources || [];
    if (!all.length) { this.setData({ loading: true, cats: [] }); return; }
    const map = {};
    all.forEach(function (r) {
      const c = r.cat || 'other';
      (map[c] = map[c] || []).push(r);
    });
    const cats = Object.keys(map).map(function (c) {
      return { key: c, name: c, list: map[c] };
    });
    const collapsed = {};
    cats.forEach(function (c, i) { collapsed[c.key] = i !== 0; });
    this.setData({ cats: cats, collapsed: collapsed, loading: false });
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
