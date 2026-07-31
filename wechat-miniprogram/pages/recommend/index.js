var app = getApp();
var api = require('../../utils/api.js');

var dailyRecData = null;
var audioCtx = null;  // 微信新版音频 API

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  var m = Math.floor(s / 60);
  var sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

Page({
  data: {
    recommendDate: '',
    blogs: [],
    songs: [],
    playingId: '',
    playPos: 0,    // 当前播放位置（秒）
    playDur: 0,    // 音频总时长
    playPct: 0     // 进度百分比
  },

  onLoad: function () {
    var self = this;
    app.onReady(function () { self.render(); });
  },

  onShow: function () {
    if (app.state) this.render();
  },

  onUnload: function () {
    if (audioCtx) { audioCtx.destroy(); audioCtx = null; }
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

  togglePlay: function (e) {
    var id = e.currentTarget.dataset.id;
    var url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '无音源', icon: 'none' });
      return;
    }
    var self = this;
    if (this.data.playingId === id && audioCtx) {
      // 已在播放这首：暂停/继续
      if (this.data.playPos > 0 && this.data.playPos < this.data.playDur - 1) {
        audioCtx.pause();
        this.setData({ playingId: '' });
      } else {
        audioCtx.play();
        this.setData({ playingId: id });
      }
      return;
    }
    // 切歌：销毁旧的、创建新的
    if (audioCtx) { audioCtx.destroy(); audioCtx = null; }
    audioCtx = wx.createInnerAudioContext();
    audioCtx.src = url;
    audioCtx.onPlay(function () { self.setData({ playingId: id }); });
    audioCtx.onPause(function () { self.setData({ playingId: '' }); });
    audioCtx.onStop(function () { self.setData({ playingId: '', playPos: 0, playPct: 0 }); });
    audioCtx.onEnded(function () { self.setData({ playingId: '', playPos: 0, playPct: 0 }); });
    audioCtx.onTimeUpdate(function () {
      var pos = audioCtx.currentTime || 0;
      var dur = audioCtx.duration || 0;
      self.setData({
        playPos: pos,
        playDur: dur,
        playPct: dur > 0 ? pos / dur * 100 : 0
      });
    });
    audioCtx.onError(function (err) {
      console.warn('audio error', err);
      wx.showToast({ title: '播放失败', icon: 'none' });
      self.setData({ playingId: '' });
    });
    audioCtx.play();
  },

  seekSong: function (e) {
    if (!audioCtx || !this.data.playingId) return;
    var ratio = e.detail.value / 100;
    var dur = this.data.playDur;
    if (dur > 0) {
      audioCtx.seek(dur * ratio);
    }
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

    api.putProgress('default', { song_likes: fb.like, song_dislikes: fb.dislike }).catch(function () {});

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
    if (audioCtx) { audioCtx.destroy(); audioCtx = null; }
    this.setData({ playingId: '', playPos: 0, playDur: 0, playPct: 0 });
    this.render();
    wx.showToast({ title: '已刷新推荐', icon: 'none' });
  }
});
