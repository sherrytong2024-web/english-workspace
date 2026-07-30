# 综合英语素质提升工作台 · 微信小程序版

由网页版 `english-workspace/index.html` 转换而来的原生微信小��序。保留全部功能：单词本（每日推荐/筛选/翻页/添加）、对话练习（6 阶段循序渐进/折叠/复习）、资源中心（官方链接）、每日推荐、学习记录（按日期筛选）、复习、学习概览（日历）。

技术要点：
- 纯前端，数据用 `wx.setStorageSync` 本地存储（键前缀 `enws_`，与网页版兼容）
- 8 个页面用 `wx.redirectTo` 互相跳转（移动端无左侧固定栏，改为抽屉式导航）
- 无后端、无网络请求，所有内容离线可用

## 目录结构
```
wechat-miniprogram/
├── app.js / app.json / app.wxss      # 全局入口与样式
├── project.config.json               # 项目配置（含 appid）
├── sitemap.json
├── components/nav-drawer/            # 抽屉导航组件（顶部栏 + 侧边菜单）
├── utils/
│   ├── data.js                       # 种子数据（单词/对话/资源，自动提取）
│   ├── state.js                      # 状态管理/容错/每日单词/推荐逻辑
│   └── store.js                      # 本地存储封装
└── pages/                            # 8 个页面，每页 index.{js,wxml,wxss,json}
    ├── dashboard  仪表盘
    ├── words      单词本
    ├── dialogues  对话练习
    ├── resources  资源中心
    ├── recommend  每日推荐
    ├── log        学习记录
    ├── review     复习
    └── overview   学习概览（日历）
```

## 发布步骤（从零开始）

### 1. 注册小程序账号
- 打开 https://mp.weixin.qq.com ，用微信扫码注册
- 选择「小程序」，按提示完成主体信息登记（个人主体即可，无需企业）
- 在「开发管理 → 开发设置」拿到 **AppID**（形如 `wx` 开头的字符串）

### 2. 填入 AppID（已完成）
- `project.config.json` 的 `appid` 已写入真实 AppID **wx9df176389f51092c**
- 注意：AppSecret 不参与代码上传，无需填入工程；它仅用于服务端开放接口，请勿贴入聊天/文件，建议已在后台重置

### 3. 导入并预览
- 下载安装「微信开发者工具」（https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html）
- 打开工具 → 导入项目 → 目录选 `wechat-miniprogram/` → AppID 会自动识别
- 点「编译」，模拟器即显示工作台，可点左上角 ☰ 切换页面

### 4. 上传与发布（两种方式）
**方式 A：开发者工具（最简单）**
- 工具右上角「上传」→ 填版本号与备注 → 上传成功
- 回 mp.weixin.qq.com → 版本管理 → 提交审核（首次需补充类目与服务内容）
- 审核通过后「发布」，即可在微信里搜索使用

**方式 B：CI 命令行上传（无需开工具）**
- 在 mp.weixin.qq.com → 开发管理 → 开发设置 → **小程序代码上传密钥** 下载 `private.<appid>.key`
- 把 key 放到 `tools/upload.key`
- `cd wechat-miniprogram && npm install miniprogram-ci && node tools/upload.js`
- 上传成功后同样去后台提交审核、发布

> 安全提示：上传密钥等同于代码发布权限，请勿提交到 Git 或贴入聊天；`.key` 已在 `tools/` 但上传脚本忽略规则里未排除，请自行加入 `.gitignore`。

## 已知限制
- **外链打开**：小程序禁止直接跳转外部网页。资源/推荐卡片点击会「复制链接」，需到浏览器粘贴打开。若要内嵌网页，需用 `web-view` 组件并配置业务域名（个人主体受限）。
- **数据迁移**：小程序与网页版数据各自独立存储，无法互通。
- **无云端同步**：数据仅存本机，换设备/清缓存会丢失（与网页版一致）。
- **真机校验**：布局已在语法与结构层校验，真机效果请在开发者工具模拟器及真机预览中确认。

## 重新生成数据
若网页版种子数据更新，可重跑 `python3 gen_data.py` 重新提取 `utils/data.js`（其余页面逻辑不受影响）。
