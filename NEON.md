# Neon Postgres 持久化配置（让云端数据不丢）

## 为什么必须做这一步

应用已部署到 Render（`https://english-workspace.onrender.com`），但 Render 的免费磁盘是**临时文件系统**：服务重启、休眠、或重新部署时，容器内的 SQLite 文件会被清空，学习进度会丢失。

后端代码已支持外部 Postgres：设置环境变量 `DATABASE_URL` 后，自动改用 Postgres，数据持久、不随重启丢失。本步骤就是把它接上。

## 步骤一：在 Neon 建免费数据库

1. 打开 https://neon.tech ，用 GitHub 账号登录（与 Render 同一账号最省事）
2. 点 **Create project**（免费版零费用）
3. 区域选 **AWS US East (N. Virginia)** 或 **AWS Singapore**（离 Render 美东近、延迟低，选其一即可）
4. 创建完成后，进入项目 → **Dashboard**，找到 **Connection String**（连接串），格式类似：
   `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
5. 复制整串（含密码）

## 步骤二：填到 Render 环境变量

1. 打开 Render → 你的服务 **english-workspace** → **Environment**
2. 点 **Add Environment Variable**
3. Key 填 `DATABASE_URL`
4. Value 粘贴刚才复制的 Neon 连接串
5. 点 **Save Changes**

保存后 Render 会自动重新部署（约 3-5 分钟）。

## 步骤三：验证持久化生效

部署完成后：

1. 浏览器打开 `https://english-workspace.onrender.com/`
2. 打开管理后台 `https://english-workspace.onrender.com/admin` 看是否有数据
3. 或 API 验证：
   `curl https://english-workspace.onrender.com/api/stats`
   应返回 `{"words":117,"dialogues":10,"resources":24,"logs":0}`
4. 关键验证：手动重启一次 Render 服务（Manual Deploy → Restart），再访问 `/api/stats`，数据仍在，说明持久化成功。

## 常见坑

| 现象 | 原因 | 修法 |
|---|---|---|
| 部署后 `/api/stats` 报错 500 | Neon 连接串含无效字符或未含 `sslmode` | 确认连接串以 `?sslmode=require` 结尾 |
| 连接超时 | Neon 免费版默认会休眠（无流量 5 分钟后 suspend） | 首次访问会冷启动等待，或升级 Neon 计划 |
| 数据没迁移 | 旧 SQLite 数据无法自动转移 | 当前为全新库，后端会自动 seed 117 词/10 对话/24 资源；历史进度重来即可 |

## 说明

- 配置了 `DATABASE_URL` 后，backend 的 `database.py` 走 Postgres 分支，自动 `create_all` 建表，首次启动空库时还会用 `seed_data.json` 自动播种。
- 不配置 `DATABASE_URL` 也能跑（用本地 SQLite），但数据不持久，仅适合临时演示。

来源：Render 官方文档（环境变量与 ephemeral disk）、Neon 官方文档（connection string 获取方式），均为公开可查。
