const app = getApp();
const stateLib = require('../../utils/state.js');
const SEED_DIALOGS = require('../../utils/data.js').SEED_DIALOGS;

Page({
  data: { tab: 'dialog', dialogs: [], words: [], expanded: '' },
  onShow: function () {
    this.state = app.state;
    this.render();
  },
  render: function () {
    const s = this.state;
    if (this.data.tab === 'dialog') {
      const ds = SEED_DIALOGS.filter(function (d) {
        return s.learnedDialogs.indexOf(d.id) >= 0;
      }).map(function (d) {
        return {
          id: d.id, scene: d.scene,
          body: d.body.map(function (l, i) { return Object.assign({ _i: i }, l); }),
          keywords: d.keywords || []
        };
      });
      this.setData({ dialogs: ds });
    } else {
      const ws = s.words.filter(function (w) {
        return s.reviewState.mastered.indexOf(w.word) >= 0;
      }).map(function (w) {
        return { word: w.word, meaning: w.meaning, phonetic: w.phonetic };
      });
      this.setData({ words: ws });
    }
  },
  setTab: function (e) {
    this.setData({ tab: e.currentTarget.dataset.tab, expanded: '' });
    this.render();
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
    app.saveState();
    this.render();
  },
  markMastered: function (e) {
    const word = e.currentTarget.dataset.word;
    const s = this.state;
    const idx = s.reviewState.mastered.indexOf(word);
    if (idx >= 0) s.reviewState.mastered.splice(idx, 1);
    else s.reviewState.mastered.push(word);
    app.saveState();
    this.render();
  }
});
