#!/bin/bash

# Zenith 后端启动脚本

echo "🚀 启动 Zenith 后端服务..."

# 检查是否安装了 uv
if ! command -v uv &> /dev/null; then
    echo "❌ 错误: 未找到 uv 命令，请先安装 uv"
    echo "安装命令: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# 检查是否存在 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  警告: 未找到 .env 文件，将使用默认配置"
    echo "请复制 env.example 为 .env 并根据需要修改配置"
fi

# 同步依赖
echo "📦 同步项目依赖..."
uv sync

# 启动服务
echo "🌟 启动 FastAPI 服务..."
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload 