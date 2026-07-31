const app = getApp();
const api = require('../../utils/api.js');

Page({
  data: { blogs: [], songs: [], loading: true },
  onShow: function () {
    this.fetchRecommend();
  },
  fetchRecommend: function () {
    var self = this;
    self.setData({ loading: true });
    api.getRecommend().then(function (data) {
      self.setData({ blogs: data.blogs || [], songs: data.songs || [], loading: false });
    }).catch(function () {
      self.setData({ loading: false, error: '加载失败，请重试' });
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },
  openLink: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.setClipboardData({ data: url, success: function () { wx.showToast({ title: '链接已复制', icon: 'none' }); } });
  },
  playSong: function (e) {
    const url = e.currentTarget.dataset.url;
    if (!url) { wx.showToast({ title: '无预览', icon: 'none' }); return; }
    wx.setClipboardData({ data: url, success: function () { wx.showToast({ title: '预览链接已复制', icon: 'none' }); } });
  },
  refresh: function () { this.fetchRecommend(); }
});
