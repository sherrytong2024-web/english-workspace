// 微信小程序 CI 上传脚本（需代码上传密钥 .key 文件）
// 用法：
//   1. 在 mp.weixin.qq.com -> 开发管理 -> 开发设置 -> 小程序代码上传密钥 下载 private.<appid>.key
//   2. 把 key 放到本目录 tools/ 下，命名为 upload.key
//   3. npm install miniprogram-ci
//   4. node tools/upload.js
const ci = require('miniprogram-ci');
const path = require('path');

const appid = 'wx9df176389f51092c';
const projectPath = path.resolve(__dirname, '..');
const privateKeyPath = path.resolve(__dirname, 'upload.key');

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath,
  privateKeyPath,
  ignores: ['node_modules/**', 'tools/**', 'README.md', '**/*.py'],
});

(async () => {
  try {
    const uploadResult = await ci.upload({
      project,
      version: '1.0.0',
      desc: '综合英语素质提升工作台',
      setting: {
        es6: true,
        minified: true,
        urlCheck: false,
      },
    });
    console.log('上传成功:', JSON.stringify(uploadResult));
  } catch (e) {
    console.error('上传失败:', e.message || e);
    process.exit(1);
  }
})();
