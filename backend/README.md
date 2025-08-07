# Zenith 后端

**Zenith 是一个为小微团队打造的、极简且数据私有的开源协作系统。**

后端服务由您自己在服务器上部署，所有任务、日记、文件等核心数据都掌握在自己手中。

---

## ✨ 核心理念

在当今充满“工具过载”和“配置疲劳”的时代，Zenith 为追求高效、简洁并重视数据主权的小微团队而生。我们坚信，工具应当回归其本质——安静地服务于人，而非让人陷入复杂的流程。

Zenith 砍掉了所有不必要的臃肿功能，只保留了团队协作最核心的部分，并通过独特的架构，让您对自己的核心数据拥有 100% 的控制权。

## 🏛️ 系统架构 (后端部分)

Zenith 采用创新的 **“官方托管前端 + 用户自托管后端”** 模式。您只需要将后端的应用程序在自己的服务器上运行起来。前端通过您配置的 API 地址与您的后端进行通信。

```
+--------------+      +-------------------------+      +-------------------------+
| 用户浏览器    |  ->  |  官方前端 (Zenith App)  |  <-> |  您自己的后端 API 服务   |
| (Your Browser) |      | (app.zenith-collab.com) |      | (api.your-company.com)  |
+--------------+      +-------------------------+      +-------------------------+
```

**后端技术栈**: Python, FastAPI, SQLAlchemy, SQLite

## 🚀 快速开始 (用户部署指南)

您只需要部署后端服务，即可开始使用 Zenith。

### 1. 部署后端

**先决条件**:
*   服务器已安装 Python 3.10+
*   已安装 Git

**部署步骤**:
```bash
# 1. 克隆项目仓库
git clone https://github.com/your-username/zenith.git
cd zenith/backend

# 2. 安装项目依赖 (使用 uv)
uv sync

# 3. 配置环境变量
# 复制示例配置文件，并根据你的实际情况修改。
cp .env.example .env

# 5. 启动服务
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```
> **安全建议**: 强烈建议您使用 Nginx 或 Caddy 等反向代理工具，为您的后端 API 服务启用 HTTPS。

### 2. 访问前端

1.  在浏览器中打开 Zenith 的官方应用网址： **`https://app.zenith-collab.com`**  (<!-- 请替换为您的真实前端地址 -->)
2.  应用首次加载时，会提示您输入后端 API 地址。请输入您刚刚部署好的服务地址（例如：`https://api.your-company.com`）。
3.  完成设置后，即可开始扫码登录并使用。

## 🛠️ 参与开发 (贡献者指南)

我们欢迎任何形式的贡献！

### 1. 克隆项目

首先，Fork 本项目，然后将你的 Fork 克隆到本地。

```bash
git clone https://github.com/your-username/zenith.git
cd zenith/backend
```

### 2. 后端开发

```bash
# 进入后端目录
cd backend

# 同步开发依赖
uv sync

# 启动开发服务器 (带热重载)
uv run uvicorn main:app --reload
```

### 3. 前端开发 (可选)

如果您也需要进行前端开发，请参考 `frontend/README.md` 中的指南。

## 💻 技术栈

*   **后端**: Python, FastAPI, SQLAlchemy, SQLite
*   **环境管理**: uv

## 🤝 贡献

有任何问题或想法？欢迎提交 [Issue](<!-- Add your issues link here -->)！

如果你希望贡献代码，请遵循以下流程：
1.  Fork 本项目
2.  创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3.  提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  将分支推送到你的 Fork (`git push origin feature/AmazingFeature`)
5.  提交一个 Pull Request

## 📄 许可证

本项目基于 [MIT](./LICENSE) 许可证。
