const app = getApp();
const stateLib = require('../../utils/state.js');
const SEED_DIALOGS = require('../../utils/data.js').SEED_DIALOGS;

Page({
  data: { stages: [], expanded: '' },
  onShow: function () {
    this.state = app.state;
    this.render();
  },
  render: function () {
    const s = this.state;
    const groups = {};
    SEED_DIALOGS.forEach(function (d) {
      (groups[d.stage] = groups[d.stage] || []).push(d);
    });
    const keys = Object.keys(groups).sort(function (a, b) { return a - b; });
    const stages = keys.map(function (k) {
      return {
        stage: k,
        name: stateLib.stageName[k] || ('阶段' + k),
        color: stateLib.stageColors[k] || '#3b82f6',
        list: groups[k].map(function (d) {
          return {
            id: d.id, scene: d.scene, desc: d.desc, level: d.level, cat: d.cat,
            catName: stateLib.catName[d.cat] || d.cat,
            learned: s.learnedDialogs.indexOf(d.id) >= 0,
            body: d.body.map(function (l, i) { return Object.assign({ _i: i }, l); }),
            keywords: d.keywords || []
          };
        })
      };
    });
    this.setData({ stages: stages });
  },
  toggleBody: function (e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ expanded: this.data.expanded === id ? '' : id });
  },
  toggleLearned: function (e) {
    const id = e.currentTarget.dataset.id;
    const s = this.state;
    const idx = s.learnedDialogs.indexOf(id);
    if (idx >= 0) s.learnedDialogs.splice(idx, 1);
    else s.learnedDialogs.push(id);
    stateLib.logActivity(s, { type: 'dialog', text: (idx >= 0 ? '取消已学对话' : '学完对话') + '：' + id });
    app.saveState();
    this.render();
  },
  copyDialog: function (e) {
    const id = e.currentTarget.dataset.id;
    const d = SEED_DIALOGS.filter(function (x) { return x.id === id; })[0];
    if (!d) return;
    const text = d.body.map(function (l) { return l.s + ': ' + l.t; }).join('\n');
    wx.setClipboardData({ data: text, success: function () { wx.showToast({ title: '对话已复制', icon: 'none' }); } });
  }
});
