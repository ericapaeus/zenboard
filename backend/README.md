# Zenith 后端

**Zenith 是一个为小微团队打造的、极简且数据私有的开源协作系统。**

后端服务由您自己在服务器上部署，所有任务、日记、文件等核心数据都掌握在自己手中。

---

## ✨ 核心理念

在当今充满"工具过载"和"配置疲劳"的时代，Zenith 为追求高效、简洁并重视数据主权的小微团队而生。我们坚信，工具应当回归其本质——安静地服务于人，而非让人陷入复杂的流程。

Zenith 砍掉了所有不必要的臃肿功能，只保留了团队协作最核心的部分，并通过独特的架构，让您对自己的核心数据拥有 100% 的控制权。

## 🏛️ 系统架构

Zenith 采用创新的 **"官方托管前端 + 用户自托管后端"** 模式。您只需要将后端的应用程序在自己的服务器上运行起来。前端通过您配置的 API 地址与您的后端进行通信。

```
+--------------+      +-------------------------+      +-------------------------+
| 用户浏览器    |  ->  |  官方前端 (Zenith App)  |  <-> |  您自己的后端 API 服务   |
| (Your Browser) |      | (app.zenith-collab.com) |      | (api.your-company.com)  |
+--------------+      +-------------------------+      +-------------------------+
```

**后端技术栈**: Python, FastAPI, SQLAlchemy, SQLite

## 📁 项目结构

```
backend/
├── api/                    # API层
│   ├── main.py            # FastAPI应用主文件
│   ├── routers/           # 路由模块
│   │   ├── auth.py        # 认证路由
│   │   ├── users.py       # 用户管理路由
│   │   ├── projects.py    # 项目管理路由
│   │   ├── tasks.py       # 任务管理路由
│   │   ├── diaries.py     # 日记管理路由
│   │   └── comments.py    # 评论管理路由
│   └── schemas/           # Pydantic模型
│       ├── response.py    # 统一响应模型
│       ├── user.py        # 用户相关模型
│       ├── project.py     # 项目相关模型
│       ├── task.py        # 任务相关模型
│       ├── diary.py       # 日记相关模型
│       └── comment.py     # 评论相关模型
├── database/              # 数据库层
│   ├── base.py           # 基础模型
│   └── database.py       # 数据库连接
├── models/               # 数据模型
│   ├── user.py          # 用户模型
│   ├── project.py       # 项目模型
│   ├── task.py          # 任务模型
│   ├── diary.py         # 日记模型
│   ├── comment.py       # 评论模型
│   └── project_membership.py # 项目成员关系模型
├── services/            # 业务逻辑层
│   ├── auth_service.py  # 认证服务
│   ├── user_service.py  # 用户服务
│   ├── project_service.py # 项目服务
│   ├── task_service.py  # 任务服务
│   ├── diary_service.py # 日记服务
│   └── comment_service.py # 评论服务
├── config.py            # 配置文件
├── main.py              # 应用入口
├── pyproject.toml       # 项目配置
├── start.sh             # 启动脚本
└── env.example          # 环境变量示例
```

## 🚀 快速开始

### 1. 环境准备

**先决条件**:
*   服务器已安装 Python 3.11+
*   已安装 uv (现代Python包管理器)

**安装 uv**:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. 部署后端

```bash
# 1. 克隆项目仓库
git clone https://github.com/your-username/zenith.git
cd zenith/backend

# 2. 配置环境变量
cp env.example .env
# 编辑 .env 文件，根据需要修改配置

# 3. 安装项目依赖
uv sync

# 4. 启动服务
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

或者使用启动脚本：
```bash
chmod +x start.sh
./start.sh
```

### 3. 访问API文档

启动服务后，可以访问以下地址查看API文档：
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- OpenAPI JSON: http://localhost:8000/api/openapi.json

## 🔧 开发指南

### 项目依赖管理

使用 `uv` 进行依赖管理：
```bash
# 安装依赖
uv sync

# 添加新依赖
uv add package-name

# 添加开发依赖
uv add --dev package-name
```

### 数据库迁移

使用 Alembic 进行数据库迁移：
```bash
# 初始化迁移
alembic init migrations

# 创建迁移文件
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head




## 📋 您可以执行的命令

1. **标记当前版本**（如果遇到状态不一致）：
   ```cmd
   alembic stamp head
   ```

2. **生成迁移文件**：
   ```cmd
   alembic revision --autogenerate -m "描述"
   ```

3. **执行迁移**：
   ```cmd
   alembic upgrade head
   ```

4. **验证表创建**：
   ```cmd
   python check_db.py
   ```

现在您可以开始自己的迁移操作了！🎉


```

### 代码规范

- 使用 Black 进行代码格式化
- 使用 isort 进行导入排序
- 使用 flake8 进行代码检查

## 📋 API接口

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/qr-code` - 生成登录二维码
- `POST /api/auth/qr-code/verify` - 验证二维码
- `POST /api/auth/refresh` - 刷新访问令牌

### 用户管理
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新当前用户信息
- `GET /api/users/` - 获取用户列表
- `POST /api/users/approve/{user_id}` - 审批用户
- `GET /api/users/contract-reminders` - 获取合同到期提醒

### 项目管理
- `POST /api/projects/` - 创建项目
- `GET /api/projects/` - 获取项目列表
- `GET /api/projects/{project_id}` - 获取项目详情
- `PUT /api/projects/{project_id}` - 更新项目
- `DELETE /api/projects/{project_id}` - 删除项目

### 任务管理
- `POST /api/tasks/` - 创建任务
- `GET /api/tasks/` - 获取任务列表
- `GET /api/tasks/{task_id}` - 获取任务详情
- `PUT /api/tasks/{task_id}` - 更新任务
- `DELETE /api/tasks/{task_id}` - 删除任务

### 日记管理
- `POST /api/diaries/` - 创建日记
- `GET /api/diaries/` - 获取日记列表
- `GET /api/diaries/{diary_id}` - 获取日记详情
- `PUT /api/diaries/{diary_id}` - 更新日记
- `DELETE /api/diaries/{diary_id}` - 删除日记

### 评论管理
- `POST /api/comments/` - 创建评论
- `GET /api/comments/` - 获取评论列表
- `GET /api/comments/{comment_id}` - 获取评论详情
- `PUT /api/comments/{comment_id}` - 更新评论
- `DELETE /api/comments/{comment_id}` - 删除评论

## 🔒 安全建议

1. **HTTPS**: 强烈建议使用 Nginx 或 Caddy 等反向代理工具，为您的后端 API 服务启用 HTTPS
2. **环境变量**: 生产环境中请修改 `SECRET_KEY` 等敏感配置
3. **数据库**: 生产环境建议使用 PostgreSQL 或 MySQL 替代 SQLite
4. **防火墙**: 配置适当的防火墙规则，只开放必要的端口

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
