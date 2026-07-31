var app = getApp();
var api = require('../../utils/api.js');

var CATS = { finance: { name: '金融', cls: 'fin' }, professional: { name: '职场专业', cls: 'pro' }, daily: { name: '日常', cls: 'daily' }, travel: { name: '旅游', cls: 'travel' }, academic: { name: '学术', cls: 'pro' } };
var catKeys = Object.keys(CATS);
var catOptions = [{ name: '全部', key: 'all' }].concat(catKeys.map(function (k) { return { name: CATS[k].name, key: k }; }));
var WORDS_PER_PAGE = 20;

var curFilter = 'all';
var curSearch = '';
var curPage = 1;

Page({
  data: {
    dailyGroups: [],
    allDailyDone: false,
    dwProgress: 0,
    filterCats: catOptions.map(function (c) { return { key: c.key, name: c.name }; }),
    curFilter: 'all',
    filteredCount: 0,
    pagedWords: [],
    curPage: 1,
    totalPages: 1,
    searchText: '',
    showAddForm: false,
    newWord: { word: '', phonetic: '', meaning: '', catIdx: 0, example: '', note: '' },
    catOptions: catOptions
  },

  onLoad: function () {
    var self = this;
    app.onReady(function () { self.render(); });
  },

  onShow: function () {
    if (app.state) this.render();
  },

  render: function () {
    this.renderDailyWords();
    this.renderWordList();
  },

  /* ===== 今日单词 ===== */
  renderDailyWords: function () {
    app.ensureDailyWords();
    var groups = app.state.dailyWords || [];
    var allWords = [];
    groups.forEach(function (g) { allWords = allWords.concat(g.words || []); });
    var doneCount = allWords.filter(function (w) { return w.done; }).length;
    var total = allWords.length;

    var catMap = { finance: 'fin', professional: 'pro', daily: 'daily', travel: 'travel', academic: 'pro' };
    var catName = { finance: '金融', professional: '职场', daily: '日常', travel: '旅游', academic: '学术' };

    var displayGroups = groups.map(function (g) {
      return (g.words || []).map(function (w) {
        return {
          word: w.word,
          phonetic: w.phonetic || '',
          meaning: w.meaning || '',
          catCls: catMap[w.cat] || 'pro',
          catName: catName[w.cat] || w.cat || '',
          example: w.example || '',
          done: !!w.done
        };
      });
    });

    this.setData({
      dailyGroups: displayGroups,
      dwProgress: total ? doneCount / total * 100 : 0,
      allDailyDone: total > 0 && doneCount === total
    });
  },

  toggleDailyWord: function (e) {
    var word = e.currentTarget.dataset.word;
    var today = app.todayStr();
    var s = app.state;

    for (var gi = 0; gi < s.dailyWords.length; gi++) {
      var w = (s.dailyWords[gi].words || []).find(function (x) { return x.word === word; });
      if (w) {
        w.done = !w.done;
        var key = today + ':' + word;
        if (w.done) {
          if (s.completedDailyWords.indexOf(key) < 0) s.completedDailyWords.push(key);
          app.addLog('dailyword', '完成今日单词: ' + word);
        } else {
          s.completedDailyWords = s.completedDailyWords.filter(function (x) { return x !== key; });
        }
        app.saveState();
        app.syncProgress();
        this.renderDailyWords();
        return;
      }
    }
  },

  logDailyWords: function () {
    var today = app.todayStr();
    var s = app.state;
    (s.dailyWords || []).forEach(function (g) {
      if (g.date === today) {
        (g.words || []).forEach(function (w) {
          if (!w.done) {
            w.done = true;
            var key = today + ':' + w.word;
            if (s.completedDailyWords.indexOf(key) < 0) s.completedDailyWords.push(key);
            app.addLog('dailyword', '完成今日单词: ' + w.word);
          }
        });
      }
    });
    app.saveState();
    app.syncProgress();
    this.renderDailyWords();
    wx.showToast({ title: '已全部标记为完成', icon: 'none' });
  },

  addMoreDailyWords: function () {
    var s = app.state;
    var used = {};
    (s.dailyWords || []).forEach(function (g) {
      (g.words || []).forEach(function (w) { used[w.word] = true; });
    });
    var candidates = (s.words || []).filter(function (w) { return !used[w.word]; });
    if (!candidates.length) {
      wx.showToast({ title: '词库所有单词都已加入', icon: 'none' });
      return;
    }
    var shuffled = candidates.slice().sort(function () { return Math.random() - 0.5; });
    var today = app.todayStr();
    s.dailyWords.push({
      date: today,
      words: shuffled.slice(0, 10).map(function (w) {
        return { word: w.word, meaning: w.meaning, phonetic: w.phonetic, cat: w.cat, example: w.example, done: false };
      })
    });
    app.saveState();
    app.syncProgress();
    wx.showToast({ title: '已追加 10 个新单词', icon: 'none' });
    this.renderDailyWords();
  },

  /* ===== 词库列表 ===== */
  renderWordList: function () {
    var words = (app.state.words || []).slice();
    // 筛选 + 搜索
    var filtered = words.filter(function (w) {
      var matchCat = curFilter === 'all' || w.cat === curFilter;
      var matchSearch = !curSearch ||
        (w.word || '').toLowerCase().indexOf(curSearch.toLowerCase()) >= 0 ||
        (w.meaning || '').toLowerCase().indexOf(curSearch.toLowerCase()) >= 0;
      return matchCat && matchSearch;
    });

    var totalPages = Math.max(1, Math.ceil(filtered.length / WORDS_PER_PAGE));
    if (curPage > totalPages) curPage = totalPages;

    var mastered = app.state.reviewState.mastered || [];
    var catMap = { finance: 'fin', professional: 'pro', daily: 'daily', travel: 'travel', academic: 'pro' };
    var catName = { finance: '金融', professional: '职场', daily: '日常', travel: '旅游', academic: '学术' };

    var paged = filtered.slice((curPage - 1) * WORDS_PER_PAGE, curPage * WORDS_PER_PAGE).map(function (w) {
      return {
        word: w.word,
        phonetic: w.phonetic || '',
        meaning: w.meaning || '',
        catCls: catMap[w.cat] || 'pro',
        catName: catName[w.cat] || w.cat || '',
        example: w.example || '',
        mastered: mastered.indexOf(w.word) >= 0
      };
    });

    this.setData({
      filteredCount: filtered.length,
      pagedWords: paged,
      curPage: curPage,
      totalPages: totalPages
    });
  },

  setFilter: function (e) {
    curFilter = e.currentTarget.dataset.key;
    curPage = 1;
    this.setData({ curFilter: curFilter });
    this.renderWordList();
  },

  onSearch: function (e) {
    curSearch = e.detail.value;
    curPage = 1;
    this.setData({ searchText: curSearch });
    this.renderWordList();
  },

  goPage: function (e) {
    var p = parseInt(e.currentTarget.dataset.p);
    if (p < 1) return;
    curPage = p;
    this.renderWordList();
  },

  delWord: function (e) {
    var word = e.currentTarget.dataset.word;
    var self = this;
    wx.showModal({
      title: '确认删除',
      content: '确定删除单词「' + word + '」？',
      success: function (res) {
        if (res.confirm) {
          app.state.words = (app.state.words || []).filter(function (w) { return w.word !== word; });
          app.addLog('word', '删除单词: ' + word);
          app.saveState();
          self.render();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  markMastered: function (e) {
    var word = e.currentTarget.dataset.word;
    var mastered = app.state.reviewState.mastered;
    if (mastered.indexOf(word) >= 0) {
      app.state.reviewState.mastered = mastered.filter(function (x) { return x !== word; });
    } else {
      mastered.push(word);
    }
    app.saveState();
    app.syncProgress();
    this.renderWordList();
  },

  /* ===== 添加单词 ===== */
  showAddForm: function () {
    this.setData({
      showAddForm: true,
      newWord: { word: '', phonetic: '', meaning: '', catIdx: 0, example: '', note: '' }
    });
  },

  hideAddForm: function () {
    this.setData({ showAddForm: false });
  },

  onNewWordField: function (e) {
    var field = e.currentTarget.dataset.field;
    var nw = this.data.newWord;
    nw[field] = e.detail.value;
    this.setData({ newWord: nw });
  },

  onCatChange: function (e) {
    var nw = this.data.newWord;
    nw.catIdx = parseInt(e.detail.value);
    this.setData({ newWord: nw });
  },

  saveWord: function () {
    var nw = this.data.newWord;
    var word = (nw.word || '').trim();
    if (!word) {
      wx.showToast({ title: '请输入单词', icon: 'none' });
      return;
    }
    if ((app.state.words || []).some(function (x) { return (x.word || '').toLowerCase() === word.toLowerCase(); })) {
      wx.showToast({ title: '单词已存在', icon: 'none' });
      return;
    }
    var cat = nw.catIdx > 0 ? catOptions[nw.catIdx].key : 'finance';
    var entry = {
      word: word,
      phonetic: nw.phonetic || '',
      meaning: nw.meaning || '(无释义)',
      cat: cat,
      example: nw.example || '',
      note: nw.note || ''
    };
    app.state.words.push(entry);
    app.addLog('word', '新增单词: ' + word);
    app.saveState();
    // 同步云端
    api.postWord(entry).catch(function () {});

    this.hideAddForm();
    this.render();
    wx.showToast({ title: '已添加', icon: 'none' });
  },

  goReview: function () {
    wx.redirectTo({ url: '/pages/review/index' });
  }
});
