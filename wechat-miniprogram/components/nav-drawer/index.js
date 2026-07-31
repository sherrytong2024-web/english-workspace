Component({
  properties: {
    title: { type: String, value: '' },
    current: { type: String, value: '' }
  },
  data: {
    groups: [
      {
        label: '学习',
        items: [
          { key: 'overview', label: '学习概览', icon: '\ud83d\udcc5' },
          { key: 'recommend', label: '每日推荐', icon: '\u2728' },
          { key: 'words', label: '单词本', icon: '\ud83d\udcd6' },
          { key: 'dialogues', label: '对话练习', icon: '\ud83d\udcac' }
        ]
      },
      {
        label: '记录',
        items: [
          { key: 'review', label: '复习', icon: '\ud83d\udd01' },
          { key: 'resources', label: '资源中心', icon: '\ud83d\udd17' },
          { key: 'log', label: '学习记录', icon: '\ud83d\udcdd' }
        ]
      }
    ],
    drawerOpen: false,
    statusBarHeight: 20
  },
  lifetimes: {
    attached: function () {
      try {
        var info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
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
      var key = e.currentTarget.dataset.key;
      this.setData({ drawerOpen: false });
      if (key === this.data.current) return;
      wx.redirectTo({ url: '/pages/' + key + '/index' });
    }
  }
});
