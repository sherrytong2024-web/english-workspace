# 英语工作台：连 API 与云端部署指南

适用对象：已有本地 FastAPI 后端（english-backend，端口 8866）和前端 index.html（english-workspace）。
目标：把数据层从 localStorage 改成调用后端 API，并部署到公网，数据持久保存。

---

## 一、整体思路

本地现状：前端独立，所有数据写在浏览器 localStorage（键前缀 `enws_`），后端 API 已完整但不被前端调用。
云端目标：一个 Web 服务同时托管后端 API、管理后台、前端页面（同源，免 CORS），数据库用外部 Postgres 持久化。

```
本地：  浏览器(index.html, localStorage)  ←×不连→  后端(本地 8866, SQLite)
云端：  浏览器 / 小程序  ──HTTPS──>  Render Web Service(8866)
                                    ├─ /api/*  后端接口
                                    ├─ /admin  管理后台
                                    ├─ /       前端页面
                                    └─ Neon Postgres(外部，持久)
```

---

## 二、把前端接到 API（核心改动）

当前 `index.html` 第 404-405 行用 localStorage 读写。要接后端，把数据来源从 localStorage 换成 `fetch('/api/...')`。

最小可用的请求封装（加到 index.html 的 `<script>` 顶部）：

```js
const API = location.origin; // 同源部署时即当前域名
async function apiGet(p){ return (await fetch(API + p)).json(); }
async function apiPost(p, body){
  return (await fetch(API + p, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })).json();
}
async function apiDel(p){
  return (await fetch(API + p, { method: "DELETE" })).json();
}
```

替换示例（单词列表初始化）：

```js
// 旧：从 localStorage 或内置常量读
// load('words', SEED_WORDS)
// 新：从后端读
const words = await apiGet('/api/words?size=500');
```

需要逐个替换的点（都在 index.html 内）：
- 单词本：加载、新增、删除、标记掌握 → `/api/words` 系列
- 对话练习：列表、自定义、移入复习 → `/api/dialogues` 系列
- 资源中心：列表、分类 → `/api/resources` 系列
- 学习记录 / 进度：读写 → `/api/logs`、`/api/progress/{user}`
- 管理后台 admin/index.html 已经直接调 `/api/*`，无需改

注意：完整改写约需替换 index.html 内多处数据逻辑，工作量较大。可先按上面的封装接好单词本做验证，再逐步迁移其余模块。

---

## 三、小程序接 API

小程序（wechat-miniprogram）当前用本地数据。接后端要用 `wx.request`，且必须在微信公众平台配置合法域名（仅 HTTPS，localhost 不可达真机）。

```js
wx.request({
  url: 'https://你的后端域名/api/words?size=500',
  success: (res) => { console.log(res.data); }
});
```

配置步骤：
1. 登录 mp.weixin.qq.com，进入「开发管理 → 开发设置 → 服务器域名」
2. 在 request 合法域名里添加 `https://你的后端域名`
3. 真机调试时需用 HTTPS 公网地址，开发者工具可勾选「不校验合法域名」临时测试

---

## 四、GitHub 版本管理

仓库已初始化并提交（见下方步骤）。日常流程：

```bash
git add -A
git commit -m "feat: 后端云就绪 + 部署配置"
git push
```

首次推送（需先在 github.com 新建空仓库，拿到地址）：

```bash
git remote add origin https://github.com/你的用户名/english-workspace.git
git branch -M main
git push -u origin main
```

---

## 五、部署到 Render（免费）

Render 对 Python Web 服务免费，且能直接连 GitHub 自动部署。

1. 注册 render.com，用 GitHub 账号登录并授权
2. New → Web Service → 选刚才的仓库
3. 关键配置（仓库里的 render.yaml 已预设，可核对）：
   - Root Directory：`english-backend`
   - Build Command：`pip install -r requirements.txt`
   - Start Command：`uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Plan：Free
4. 点击 Create Web Service，等待构建
5. 部署完成后得到 `https://english-workspace-xxx.onrender.com`
   - 前端：`/`
   - 接口：`/api/stats`
   - 后台：`/admin`
   - 文档：`/docs`

Free 计划的注意事项：15 分钟无访问会休眠，下次冷启动约 30-60 秒；非付费磁盘上的 SQLite 会随重启清空，所以务必接外部数据库（下一节）。

---

## 六、数据库持久化（Neon，免费）

Render 免费磁盘不持久，数据库要用外部 Postgres。Neon 提供免费 Postgres。

1. 注册 neon.tech，新建项目，拿到连接串，形如：
   `postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/neondb?sslmode=require`
2. 在 Render 服务页 → Environment → 添加环境变量：
   - 键：`DATABASE_URL`
   - 值：上面的连接串
3. 保存后 Render 会自动重启；启动时空数据库会自动用 seed_data.json 播种
4. 验证：`https://你的域名/api/stats` 应返回 `{words:117, dialogues:10, resources:24, ...}`

---

## 七、上线后验证

- 打开 `/`，页面是否正常（此时仍是 localStorage 版，仅验证托管成功）
- 打开 `/admin`，增删一条单词，再查 `/api/words` 是否变化
- 打开 `/docs`，用 Swagger 试几个接口
- 改 DATABASE_URL 后重启，确认数据仍在（持久化生效）

---

## 八、常见坑与备选

- 小程序真机必须 HTTPS + 已配置合法域名，localhost 不通
- 前端不接 API 也能部署，但那样数据仍在各用户浏览器本地，没有集中存储
- Render 免费休眠：可用 cron 定时 ping `/api/stats` 保活（需外部定时服务）
- 备选平台：Railway（更稳但有免费额度限制）、PythonAnywhere（文件系统持久但 FastAPI 需手动配 ASGI）、Fly.io（需 Docker，适合进阶）
- 密钥安全：AppSecret、DATABASE_URL 只放环境变量，不要写进代码或提交 git

---

## 已生成的部署文件

- `english-backend/render.yaml`：Render 部署描述
- `english-backend/Procfile`：启动命令
- `english-backend/runtime.txt`：Python 3.12
- `english-backend/seed_data.json`：从 index.html 抽出的种子数据缓存（云端播种用，无需 Node）
- `english-backend/database.py`：支持 DATABASE_URL（Postgres）/ 本地 SQLite 兜底
- `english-backend/main.py`：同源托管前端与管理后台，空库自动播种
- `.gitignore`：排除 venv、本地库、密钥
