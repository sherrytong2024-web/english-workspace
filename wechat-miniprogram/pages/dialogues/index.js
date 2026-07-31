const app = getApp();
const stateLib = require('../../utils/state.js');

// Dynamic scene name cleaning
function cleanScene(s) { return (s || ''); }

Page({
  data: { stages: [], expanded: '' },
  onShow: function () {
    this.state = app.state;
    app.onReady(() => { this.state = app.state; this.render(); });
    if (this.state.allDialogues && this.state.allDialogues.length) this.render();
  },
  render: function () {
    const s = this.state;
    const all = s.allDialogues || [];
    if (!all.length) {
      this.setData({ stages: [], empty: '加载中...' }); return;
    }

    const sorted = all.slice().sort((a, b) => (a.order || 99) - (b.order || 99));

    // Dynamic stage grouping
    const stageMap = {};
    sorted.forEach(function (d) {
      const st = d.stage || '其他';
      (stageMap[st] = stageMap[st] || []).push(d);
    });
    const keys = Object.keys(stageMap).sort((a, b) => {
      return (stageMap[a][0].order || 99) - (stageMap[b][0].order || 99);
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9',
      '#14b8a6', '#f97316', '#6366f1', '#ec4899', '#84cc16', '#06b6d4'];

    const stages = keys.map(function (k, si) {
      return {
        stage: k,
        color: colors[si % colors.length],
        list: stageMap[k].map(function (d) {
          return {
            id: d.id, scene: d.scene, desc: d.desc, level: d.level, cat: d.cat,
            catName: (stateLib.catName || {})[d.cat] || d.cat,
            learned: (s.learnedDialogs || []).indexOf(d.id) >= 0,
            body: (d.body || []).map(function (l, i) { return Object.assign({ _i: i }, l); }),
            keywords: d.keywords || []
          };
        })
      };
    });
    this.setData({ stages: stages, empty: '' });
  },
  toggleBody: function (e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ expanded: this.data.expanded === id ? '' : id });
  },
  toggleLearned: function (e) {
    const id = e.currentTarget.dataset.id;
    const s = this.state;
    const idx = (s.learnedDialogs || []).indexOf(id);
    if (idx >= 0) s.learnedDialogs.splice(idx, 1);
    else s.learnedDialogs.push(id);
    stateLib.logActivity(s, { type: 'dialog', text: (idx >= 0 ? '取消已学' : '学完') + '：' + id });
    app.saveState();
    this.render();
  },
  copyDialog: function (e) {
    const id = e.currentTarget.dataset.id;
    const d = (this.state.allDialogues || []).find(function (x) { return x.id === id; });
    if (!d) return;
    const text = (d.body || []).map(function (l) { return l.s + ': ' + l.t; }).join('\n');
    wx.setClipboardData({ data: text, success: function () { wx.showToast({ title: '已复制', icon: 'none' }); } });
  }
});
