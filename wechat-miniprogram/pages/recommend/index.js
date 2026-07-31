var app = getApp();
var api = require('../../utils/api.js');

var dailyRecData = null;

Page({
  data: {
    recommendDate: '',
    blogs: [],
    songs: []
  },

  onLoad: function () {
    var self = this;
    app.onReady(function () { self.render(); });
  },

  onShow: function () {
    if (app.state) this.render();
  },

  render: function () {
    var self = this;
    this.setData({ recommendDate: app.todayStr() });

    if (dailyRecData) {
      this.renderBlogs(dailyRecData.blogs || []);
      this.renderSongs(dailyRecData.songs || []);
      return;
    }

    api.getRecommend().then(function (data) {
      dailyRecData = data;
      self.renderBlogs(data.blogs || []);
      self.renderSongs(data.songs || []);
    }).catch(function () {
      self.setData({ blogs: [], songs: [] });
    });
  },

  renderBlogs: function (blogs) {
    this.setData({ blogs: blogs });
  },

  renderSongs: function (songs) {
    var store = require('../../utils/store.js');
    var fb = store.load('songFeedback', { like: [], dislike: [] });
    var self = this;
    this.setData({
      songs: songs.map(function (s) {
        return {
          id: s.id,
          title: s.title || '',
          artist: s.artist || '',
          artwork_url: s.artwork_url || '',
          preview_url: s.preview_url || '',
          liked: fb.like.indexOf(s.id) >= 0,
          disliked: fb.dislike.indexOf(s.id) >= 0
        };
      })
    });
  },

  toggleSong: function (e) {
    var store = require('../../utils/store.js');
    var fb = store.load('songFeedback', { like: [], dislike: [] });
    var id = e.currentTarget.dataset.id;
    var type = e.currentTarget.dataset.type;
    var other = type === 'like' ? 'dislike' : 'like';

    if (fb[type].indexOf(id) >= 0) {
      fb[type] = fb[type].filter(function (x) { return x !== id; });
    } else {
      fb[type].push(id);
      fb[other] = fb[other].filter(function (x) { return x !== id; });
    }
    store.save('songFeedback', fb);

    // 云端同步
    api.putProgress('default', { song_likes: fb.like, song_dislikes: fb.dislike }).catch(function () {});

    // 重渲染歌曲
    if (dailyRecData && dailyRecData.songs) this.renderSongs(dailyRecData.songs);

    app.addLog('recommend', (type === 'like' ? '喜欢' : '跳过') + '歌曲: ' + id);
  },

  copyLink: function (e) {
    var url = e.currentTarget.dataset.url;
    wx.setClipboardData({
      data: url,
      success: function () { wx.showToast({ title: '链接已复制', icon: 'none' }); }
    });
  },

  refreshRecommend: function () {
    dailyRecData = null;
    this.render();
    wx.showToast({ title: '已刷新推荐', icon: 'none' });
  }
});
