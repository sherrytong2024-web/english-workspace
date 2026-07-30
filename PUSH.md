# 从创建仓库到上线：操作清单

本地仓库已就绪：分支 `main`，60 个文件已提交，尚无远程地址。下面按顺序执行即可。

---

## 第 1 步：在 GitHub 创建空仓库（浏览器操作）

1. 打开 https://github.com/new
2. Repository name 填 `english-workspace`
3. 可见性选 `Public`（或 Private 均可）
4. 关键：不要勾选 `Initialize with README` / `Add .gitignore` / `Choose a license`，本地已经有这些文件，勾了会冲突
5. 点 `Create repository`
6. 创建完成后的页面会显示仓库地址，形如：
   `https://github.com/你的用户名/english-workspace.git`
   复制这个地址，下一步要用

---

## 第 2 步：关联远程并推送（终端，在项目目录执行）

把下面地址换成你自己的（在第 1 步复制的）：

```bash
cd /Users/sherry/WorkBuddy/2026-07-30-13-50-39
git remote add origin https://github.com/你的用户名/english-workspace.git
git branch -M main
git push -u origin main
```

推送时 GitHub 会要求登录授权：

- macOS 弹窗输账号密码时，密码处填 **Personal Access Token**（不是账号密码）；
  去 GitHub → Settings → Developer settings → Personal access tokens → 生成，勾 `repo` 权限
- 或先安装并登录 GitHub CLI：`gh auth login`，之后 `git push` 会自动走 CLI 凭证

推送成功后再打开仓库页面，就能看到 english-backend、english-workspace、wechat-miniprogram 和各类配置文件。

---

## 第 3 步：部署到 Render（免费）

完整步骤见 `DEPLOY.md`。要点：

1. 注册 render.com，用 GitHub 登录并授权
2. New → Web Service → 选 `english-workspace` 仓库
3. 配置（仓库里 `render.yaml` 已预设，可核对）：
   - Root Directory：`english-backend`
   - Build：`pip install -r requirements.txt`
   - Start：`uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Plan：Free
4. 创建后等待构建，得到地址 `https://english-workspace-xxx.onrender.com`
5. 验证：`/api/stats`、`/admin`、`/`

---

## 第 4 步（可选）：让数据持久化

Render 免费磁盘不持久，数据库用外部 Postgres：

1. 注册 neon.tech，新建项目，拿到连接串
   `postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/neondb?sslmode=require`
2. Render 服务页 → Environment → 添加 `DATABASE_URL` = 上面的连接串
3. 保存重启；空库会自动用 `seed_data.json` 播种

---

## 常用后续命令

```bash
git add -A
git commit -m "你的说明"
git push
```

改了代码想重新部署：直接 `git push`，Render 会自动重新构建（前提是连了 GitHub）。
