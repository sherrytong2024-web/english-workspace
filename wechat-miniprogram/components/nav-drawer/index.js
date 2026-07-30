Component({
  properties: {
    title: { type: String, value: '' },
    current: { type: String, value: '' }
  },
  data: {
    pages: [
      { key: 'dashboard', label: '仪表盘', icon: '🏠' },
      { key: 'words', label: '单词本', icon: '📚' },
      { key: 'dialogues', label: '对话练习', icon: '💬' },
      { key: 'resources', label: '资源中心', icon: '🔗' },
      { key: 'recommend', label: '每日推荐', icon: '⭐' },
      { key: 'log', label: '学习记录', icon: '📝' },
      { key: 'review', label: '复习', icon: '🔁' },
      { key: 'overview', label: '学习概览', icon: '📅' }
    ],
    drawerOpen: false,
    statusBarHeight: 20
  },
  lifetimes: {
    attached: function () {
      try {
        const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        this.setData({ statusBarHeight: info.statusBarHeight || 20 });
      } catch (e) {}
    }
  },
  methods: {
    toggleDrawer: function () {
      this.setData({ drawerOpen: !this.data.drawerOpen });
    },
    closeDrawer: function () {
      this.setData({ drawerOpen: false });
    },
    goPage: function (e) {
      const key = e.currentTarget.dataset.key;
      this.setData({ drawerOpen: false });
      if (key === this.data.current) return;
      wx.redirectTo({ url: '/pages/' + key + '/index' });
    }
  }
});
