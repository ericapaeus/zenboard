# 微信扫码登录实现 (代理模式)

## 概述

本项目实现了**代理模式**的微信扫码登录功能，参考 `datagentic` 项目的架构设计。通过上游认证服务处理微信回调，实现解耦的微信登录流程。

## 架构设计

```
前端 → zenboard后端 → 上游认证API → 微信服务器
```

### 🔗 **代理模式优势**
- **解耦认证逻辑**: 微信认证由专门的上游服务处理
- **易于维护**: 认证逻辑集中管理
- **扩展性强**: 支持多种认证方式
- **安全性高**: 敏感配置集中管理

## 功能特性

- ✅ 生成微信登录凭据
- ✅ 检查扫码登录状态
- ✅ 获取用户OpenID并创建用户
- ✅ JWT Token生成和管理
- ✅ 令牌刷新机制
- ✅ 用户信息获取

## API接口

### 1. 生成微信登录凭据
- **URL**: `POST /api/auth/wechat/generate`
- **参数**: `redirect` (可选)
- **响应**:
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "key": "session-key",
        "url": "https://open.weixin.qq.com/connect/qrconnect?..."
    }
}
```

### 2. 检查登录状态
- **URL**: `GET /api/auth/wechat/status/{key}`
- **响应**:
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "key": "session-key",
        "url": "https://open.weixin.qq.com/connect/qrconnect?...",
        "status": "pending"
    }
}
```

### 3. 获取用户OpenID
- **URL**: `GET /api/auth/wechat/openid?code=xxx`
- **功能**: 处理微信回调，获取用户信息并生成JWT
- **响应**:
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "openid": "wx_openid_123",
        "name": "微信用户",
        "access_token": "jwt_token",
        "token_type": "bearer"
    }
}
```

### 4. 刷新令牌
- **URL**: `POST /api/auth/wechat/refresh`
- **请求体**:
```json
{
    "refresh_token": "refresh_token_string"
}
```

### 5. 获取当前用户信息
- **URL**: `GET /api/auth/wechat/me`

## 配置要求

### 环境变量
```bash
# 代理模式配置
AUTH_API_KEY=your-auth-api-key
AUTH_API_BASE_URL=https://your-auth-service.com

# JWT配置
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 上游认证服务要求
上游认证服务需要提供以下接口：
- `POST /auth/generate` - 生成登录凭据
- `GET /auth/status/{key}` - 检查登录状态
- `GET /auth/openid` - 获取用户OpenID

## 登录流程

### 1. 前端流程
```javascript
// 1. 请求生成登录凭据
const response = await fetch('/api/auth/wechat/generate', {
    method: 'POST'
});
const { key, url } = response.data;

// 2. 显示二维码
displayQRCode(url);

// 3. 轮询登录状态
const pollInterval = setInterval(async () => {
    const statusResponse = await fetch(`/api/auth/wechat/status/${key}`);
    const { status } = statusResponse.data;
    
    if (status === 'success') {
        clearInterval(pollInterval);
        // 获取用户信息
        const userResponse = await fetch(`/api/auth/wechat/openid?code=${code}`);
        const { access_token } = userResponse.data;
        
        // 保存token，跳转到主页
        localStorage.setItem('token', access_token);
        window.location.href = '/dashboard';
    }
}, 2000);
```

### 2. 后端流程
1. **生成凭据**: 调用上游API获取登录URL和会话Key
2. **状态轮询**: 前端轮询检查用户是否已扫码
3. **获取用户**: 通过code获取OpenID，创建/获取用户
4. **生成Token**: 为用户生成JWT访问令牌

## 数据库表结构

### 用户表 (users)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255),
    openid VARCHAR(64) UNIQUE,
    unionid VARCHAR(64) UNIQUE,
    avatar VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 部署说明

### 1. 配置环境变量
```bash
cp env.example .env
# 编辑.env文件，填入代理服务配置
```

### 2. 数据库迁移
```bash
alembic revision --autogenerate -m "add wechat proxy login"
alembic upgrade head
```

### 3. 启动服务
```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 与原有实现的区别

| 特性 | 原有实现 | 代理模式实现 |
|------|----------|-------------|
| 微信回调处理 | 直接处理 | 上游服务处理 |
| 配置复杂度 | 高 | 低 |
| 维护成本 | 高 | 低 |
| 扩展性 | 一般 | 强 |
| 安全性 | 一般 | 高 |

## 故障排除

### 常见问题
1. **上游API连接失败**: 检查 `AUTH_API_BASE_URL` 配置
2. **API密钥错误**: 检查 `AUTH_API_KEY` 配置
3. **用户创建失败**: 检查数据库连接和表结构
4. **Token生成失败**: 检查JWT配置

### 调试方法
1. 查看后端日志
2. 检查上游API响应
3. 验证数据库连接
4. 测试JWT生成

## 扩展功能

- [ ] 支持多种认证方式
- [ ] 用户信息完善流程
- [ ] 登录历史记录
- [ ] 多设备登录管理
- [ ] 登录安全策略 