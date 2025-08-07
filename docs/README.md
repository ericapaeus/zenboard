# Zenith

**一个为小微团队打造的、极简且数据私有的开源协作系统。**

[![构建状态](https://img.shields.io/badge/build-passing-brightgreen)](<!-- Add your CI/CD pipeline link here -->)
[![版本](https://img.shields.io/badge/version-1.0.0-blue)](<!-- Add your release link here -->)
[![许可证](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## ✨ 核心理念

在当今充满“工具过载”和“配置疲劳”的时代，Zenith 为追求高效、简洁并重视数据主权的小微团队而生。我们坚信，工具应当回归其本质——安静地服务于人，而非让人陷入复杂的流程。

Zenith 砍掉了所有不必要的臃肿功能，只保留了团队协作最核心的部分，并通过独特的架构，让您对自己的核心数据拥有 100% 的控制权。

## 🚀 主要功能

*   **三级任务系统**: 清晰的 `项目 -> 任务 -> 子任务` 结构，支持看板拖拽，满足敏捷开发流程。
*   **项目成员权限**: 每个项目都是一个独立的协作空间，只有被邀请的成员才能访问，保证信息隔离。
*   **团队日记与分享**: 支持 Markdown 的富文本编辑器，方便团队成员沉淀思考、分享知识，并可灵活控制可见性。
*   **轻量合同管理**: 内置合同到期提醒，帮助团队管理员及时处理续约事宜，不错过任何一个重要日期。
*   **数据私有化部署**: 后端服务由您自己在服务器上部署，所有任务、日记、文件等核心数据都掌握在自己手中。
*   **现代化体验**: 前端由官方托管，采用 React + Ant Design 构建，保证所有用户都能享受到流畅、一致、免维护的现代化 UI/UX。

## 🏛️ 系统架构

Zenith 采用创新的 **“官方托管前端 + 用户自托管后端”** 模式：

*   **前端 (Official Hosted Frontend)**: 我们将前端应用构建并部署在全球 CDN 上。用户无需任何部署操作，直接通过浏览器访问官方网址即可使用，并能实时获得更新。
*   **后端 (Self-Hosted Backend)**: 您只需要将后端的应用程序在自己的服务器上运行起来。前端通过您配置的 API 地址与您的后端进行通信。

```
+--------------+      +-------------------------+      +-------------------------+
| 用户浏览器    |  ->  |  官方前端 (Zenith App)  |  <-> |  您自己的后端 API 服务   |
| (Your Browser) |      | (app.zenith-collab.com) |      | (api.your-company.com)  |
+--------------+      +-------------------------+      +-------------------------+
```

## 🖼️ 产品截图

<!-- 在此处插入产品截图，例如任务看板、日记页面等 -->
<p align="center">
  <img src="" alt="Zenith 任务看板" width="80%">
</p>

## 功能计划

- [ ] **核心架构**
  - [ ]  官方托管前端 + 用户自托管后端模式
  - [ ]  基于 Python (FastAPI) + SQLite 的后端服务
  - [ ]  基于 React + Ant Design 的现代化前端
  - [ ]  **@提及通知**: 在评论或日记中 @ 成员时，发送站内通知。
  - [ ]  **全局搜索**: 快速搜索任务、日记和评论。
  - [ ]  **深色模式 (Dark Mode)**: 提供对操作系统深色模式的自动适配或手动切换。

- [ ]  **用户与团队**
  - [ ]  基于扫码的登录认证流程
  - [ ]  新用户加入的管理员审批工作流
  - [ ]  轻量化的合同到期日提醒功能
- [ ]  **任务系统**
  - [ ]  `项目 -> 任务 -> 子任务` 三级结构
  - [ ]  看板视图与拖拽更新状态
  - [ ]  基于项目成员的权限隔离
  - [ ]  `公开`、`项目`、`私有` 三种任务可见性级别
  - [ ]  **自定义任务字段**: 允许用户为项目添加自定义字段（如：优先级、估算工时）。
- [ ]  **日记与评论**
  - [ ]  全局支持 Markdown 格式的编辑器
  - [ ]  支持 `公开`、`项目`、`指定成员`、`私有` 四种可见性
  - [ ]  任务与日记下的评论功能

## ⚙️ 快速开始 (用户部署指南)

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

### 1. Fork & Clone
首先，Fork 本项目，然后将你的 Fork 克隆到本地。

### 2. 后端开发
```bash
# 进入后端目录
cd backend

# 同步开发依赖
uv sync

# 启动开发服务器 (带热重载)
uv run uvicorn main:app --reload
```

### 3. 前端开发
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
前端开发服务器将运行在 `http://localhost:5173` (或其它端口)。在浏览器中打开它，并将其 API 地址指向你本地运行的后端服务 (`http://localhost:8000`)。

## 💻 技术栈

*   **前端**: React, Ant Design, Vite
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