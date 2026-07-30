// 本地存储封装：前缀 enws_，与网页版兼容
const PREFIX = 'enws_';

function load(key, def) {
  try {
    const v = wx.getStorageSync(PREFIX + key);
    if (v === undefined || v === null || v === '') return def;
    return v;
  } catch (e) {
    return def;
  }
}

function save(key, val) {
  try {
    wx.setStorageSync(PREFIX + key, val);
  } catch (e) {}
}

function remove(key) {
  try {
    wx.removeStorageSync(PREFIX + key);
  } catch (e) {}
}

module.exports = { PREFIX, load, save, remove };
