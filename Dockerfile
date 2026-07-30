FROM python:3.12.7-slim

WORKDIR /app

# 仅装 psycopg2-binary 需要的 libpq
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# 先装依赖（利用 Docker 层缓存）
COPY english-backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY english-backend/ ./backend/

# 复制前端与后台（前端路径由 main.py 中 FRONTEND_DIR 决定：./frontend）
COPY english-workspace/ ./frontend/
COPY english-backend/admin/ ./backend/admin/

WORKDIR /app/backend

ENV PORT=10000
EXPOSE 10000

CMD uvicorn main:app --host 0.0.0.0 --port $PORT