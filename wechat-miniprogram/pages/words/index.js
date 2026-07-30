const app = getApp();
const stateLib = require('../../utils/state.js');
const CATS = require('../../utils/data.js').CATS;
const WORDS_PER_PAGE = 20;

Page({
  data: {
    dailyWords: [], doneCount: 0, dailyTotal: 0,
    filter: 'all', search: '', page: 1, totalPages: 1, list: [],
    cats: [], form: { word: '', meaning: '', phonetic: '', cat: 'finance', example: '' }
  },
  onShow: function () {
    this.state = app.state;
    this.setData({ cats: Object.keys(CATS).map(function (k) { return { key: k, name: CATS[k].name }; }) });
    this.render();
  },
  render: function () {
    const s = this.state;
    stateLib.ensureDailyWords(s);
    const dw = s.dailyWords[0];
    const done = dw ? dw.words.filter(function (w) { return w.done; }).length : 0;
    this.setData({
      dailyWords: dw ? dw.words : [],
      doneCount: done,
      dailyTotal: dw ? dw.words.length : 0
    });
    this.renderWordList(this.data.search);
  },
  setFilter: function (e) {
    this.setData({ filter: e.currentTarget.dataset.k, page: 1 });
    this.renderWordList(this.data.search);
  },
  onSearch: function (e) {
    this.setData({ search: e.detail.value, page: 1 });
    this.renderWordList(e.detail.value);
  },
  goPage: function (e) {
    const p = Number(e.currentTarget.dataset.p);
    if (p < 1) return;
    this.setData({ page: p });
    this.renderWordList(this.data.search);
  },
  renderWordList: function (search) {
    const s = this.state;
    const kw = (search || '').toLowerCase();
    const list = s.words.filter(function (w) {
      const okCat = this.data.filter === 'all' || w.cat === this.data.filter;
      const okSearch = w.word.toLowerCase().indexOf(kw) >= 0 || (w.meaning || '').indexOf(search || '') >= 0;
      return okCat && okSearch;
    }.bind(this));
    const totalPages = Math.max(1, Math.ceil(list.length / WORDS_PER_PAGE));
    let page = this.data.page;
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    const paged = list.slice((page - 1) * WORDS_PER_PAGE, page * WORDS_PER_PAGE);
    const enriched = paged.map(function (w) {
      return Object.assign({}, w, {
        catName: stateLib.catName[w.cat] || w.cat,
        mastered: s.reviewState.mastered.indexOf(w.word) >= 0
      });
    });
    this.setData({ list: enriched, totalPages: totalPages, page: page });
  },
  delWord: function (e) {
    const word = e.currentTarget.dataset.word;
    const s = this.state;
    let i = -1;
    for (let k = 0; k < s.words.length; k++) { if (s.words[k].word === word) { i = k; break; } }
    if (i >= 0) s.words.splice(i, 1);
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
  },
  onFormInput: function (e) {
    const f = e.currentTarget.dataset.field;
    const form = Object.assign({}, this.data.form);
    form[f] = e.detail.value;
    this.setData({ form: form });
  },
  addWord: function () {
    const s = this.state;
    const f = this.data.form;
    if (!f.word || !f.meaning) { wx.showToast({ title: '单词和释义必填', icon: 'none' }); return; }
    s.words.unshift({ word: f.word, meaning: f.meaning, phonetic: f.phonetic || '', cat: f.cat || 'finance', example: f.example || '' });
    app.saveState();
    this.setData({ form: { word: '', meaning: '', phonetic: '', cat: 'finance', example: '' } });
    this.render();
    wx.showToast({ title: '已添加', icon: 'success' });
  },
  toggleDailyWord: function (e) {
    const word = e.currentTarget.dataset.word;
    const s = this.state;
    const today = stateLib.todayStr();
    const key = today + ':' + word;
    const idx = s.completedDailyWords.indexOf(key);
    if (idx >= 0) s.completedDailyWords.splice(idx, 1);
    else s.completedDailyWords.push(key);
    stateLib.ensureDailyWords(s);
    app.saveState();
    this.render();
  },
  logDailyWords: function () {
    const s = this.state;
    const today = stateLib.todayStr();
    if (s.dailyWords[0]) {
      s.dailyWords[0].words.forEach(function (w) {
        const k = today + ':' + w.word;
        if (s.completedDailyWords.indexOf(k) < 0) s.completedDailyWords.push(k);
      });
    }
    stateLib.logActivity(s, { type: 'daily', text: '完成今日单词 ' + (s.dailyWords[0] ? s.dailyWords[0].words.length : 0) + ' 个' });
    app.saveState();
    wx.showToast({ title: '已标记完成', icon: 'success' });
    this.render();
  }
});
