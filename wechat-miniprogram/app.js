const store = require('./utils/store.js');
const stateLib = require('./utils/state.js');

App({
  state: null,
  onLaunch: function () {
    let s = store.load('state', null);
    if (!s) s = stateLib.defaultState();
    this.state = stateLib.sanitizeState(s);
    store.save('state', this.state);
  },
  saveState: function () {
    store.save('state', this.state);
  }
});
