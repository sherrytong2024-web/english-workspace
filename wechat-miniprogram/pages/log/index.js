const app = getApp();

Page({
  data: { list: [], filterDate: '' },
  onShow: function () {
    this.state = app.state;
    this.render();
  },
  render: function () {
    const s = this.state;
    let list = s.log;
    if (this.data.filterDate) {
      list = list.filter(function (l) { return l.t.indexOf(this.data.filterDate) === 0; }.bind(this));
    }
    this.setData({ list: list });
  },
  onDateChange: function (e) {
    this.setData({ filterDate: e.detail.value });
    this.render();
  },
  resetFilter: function () {
    this.setData({ filterDate: '' });
    this.render();
  }
});
