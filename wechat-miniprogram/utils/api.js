// API 封装 — 调用线上 Render 后端
const API_BASE = 'https://english-workspace.onrender.com';

function api(method, path, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + path,
      method: method,
      data: data,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(path + ' -> ' + res.statusCode));
        }
      },
      fail(err) { reject(err); }
    });
  });
}

module.exports = {
  getWords: (params) => api('GET', '/api/words?' + (params || 'size=2000')),
  getDialogues: () => api('GET', '/api/dialogues?size=2000'),
  getResources: () => api('GET', '/api/resources?size=500'),
  getRecommend: () => api('GET', '/api/daily/recommend'),
  getMotivation: () => api('GET', '/api/motivation'),
  getProgress: (uid) => api('GET', '/api/progress/' + (uid || 'default')),
  putProgress: (uid, data) => api('PUT', '/api/progress/' + (uid || 'default'), data),
  getLogs: (uid) => api('GET', '/api/logs?user_id=' + (uid || 'default')),
  postLog: (data) => api('POST', '/api/logs', data),
  getSources: () => api('GET', '/api/sources'),
  getStats: () => api('GET', '/api/stats'),
};
