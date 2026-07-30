const app = getApp();

Page({
  data: { year: 0, month: 0, days: [], weekNames: ['日', '一', '二', '三', '四', '五', '六'], selected: '', detail: [] },
  onShow: function () {
    this.state = app.state;
    const d = new Date();
    this.buildMonth(d.getFullYear(), d.getMonth() + 1);
  },
  buildMonth: function (y, m) {
    const s = this.state;
    const counts = {};
    s.log.forEach(function (l) {
      const ds = l.t.substring(0, 10);
      counts[ds] = (counts[ds] || 0) + 1;
    });
    const first = new Date(y, m - 1, 1);
    const startWeek = first.getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const days = [];
    for (let i = 0; i < startWeek; i++) days.push({ empty: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
      days.push({ empty: false, day: d, ds: ds, count: counts[ds] || 0 });
    }
    this.setData({ year: y, month: m, days: days });
  },
  prevMonth: function () {
    let y = this.data.year, m = this.data.month - 1;
    if (m < 1) { m = 12; y--; }
    this.buildMonth(y, m);
  },
  nextMonth: function () {
    let y = this.data.year, m = this.data.month + 1;
    if (m > 12) { m = 1; y++; }
    this.buildMonth(y, m);
  },
  showDay: function (e) {
    const ds = e.currentTarget.dataset.ds;
    const s = this.state;
    const detail = s.log.filter(function (l) { return l.t.indexOf(ds) === 0; });
    this.setData({ selected: ds, detail: detail });
  }
});
