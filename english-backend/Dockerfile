FROM python:3.12.7-slim

WORKDIR /app

# 仅安装系统级依赖（psycopg2-binary 需要 libpq）
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render 会注入 PORT；默认 10000
ENV PORT=10000
EXPOSE 10000

# 启动命令：注意是 main:app（main.py 在根目录）
CMD uvicorn main:app --host 0.0.0.0 --port $PORT