# 全局认证系统使用说明

## 概述

本项目实现了全局认证系统，所有需要认证的接口都可以使用统一的认证依赖函数。

## 认证依赖函数

### 1. `get_current_user`
基础认证依赖函数，验证 JWT token 并返回当前用户。

```python
from api.dependencies import get_current_user

@router.get("/protected-endpoint")
async def protected_endpoint(
    current_user: User = Depends(get_current_user)
):
    return {"message": f"Hello {current_user.nickname}!"}
```

### 2. `get_current_active_user`
在基础认证基础上增加用户状态检查，只允许活跃用户访问。

```python
from api.dependencies import get_current_active_user

@router.get("/active-user-only")
async def active_user_endpoint(
    current_user: User = Depends(get_current_active_user)
):
    return {"message": f"Hello active user {current_user.nickname}!"}
```

### 3. `get_current_admin_user`
管理员专用认证，可以在这里添加角色检查逻辑。

```python
from api.dependencies import get_current_admin_user

@router.get("/admin-only")
async def admin_endpoint(
    current_user: User = Depends(get_current_admin_user)
):
    return {"message": f"Hello admin {current_user.nickname}!"}
```

## 使用示例

### 创建新路由文件

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import get_db
from api.schemas.response import ApiResponse
from models.user import User
from api.dependencies import get_current_user, get_current_active_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# 需要认证的接口
@router.get("/user-profile", response_model=ApiResponse[dict])
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取用户资料 - 需要认证
    """
    return ApiResponse(
        success=True,
        message="获取用户资料成功",
        data={
            "id": current_user.id,
            "nickname": current_user.nickname,
            "email": current_user.email,
            "status": current_user.status
        },
        code=200
    )

# 只需要活跃用户的接口
@router.post("/user-action", response_model=ApiResponse[dict])
async def user_action(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    用户操作 - 需要活跃用户
    """
    return ApiResponse(
        success=True,
        message="操作成功",
        data={"user_id": current_user.id},
        code=200
    )

# 不需要认证的接口
@router.get("/public-info", response_model=ApiResponse[dict])
async def get_public_info():
    """
    获取公开信息 - 不需要认证
    """
    return ApiResponse(
        success=True,
        message="获取公开信息成功",
        data={"info": "这是公开信息"},
        code=200
    )
```

## 认证流程

1. **客户端发送请求**：在请求头中包含 `Authorization: Bearer <token>`
2. **依赖函数验证**：
   - 检查 Authorization header 是否存在
   - 解析 Bearer token
   - 验证 JWT token 签名和过期时间
   - 从数据库获取用户信息
   - 返回用户对象
3. **接口处理**：使用获取到的用户信息执行业务逻辑

## 错误处理

认证失败时会返回 401 错误：

- `Authorization header is required` - 缺少认证头
- `Invalid authentication scheme` - 认证方案错误
- `Invalid token` - token 无效
- `Invalid token payload` - token 载荷错误
- `User not found` - 用户不存在
- `User is not active` - 用户状态异常

## 配置

认证系统使用以下配置（在 `config.py` 中）：

```python
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

## 注意事项

1. **安全性**：生产环境中请修改 `SECRET_KEY`
2. **性能**：每次认证都会查询数据库，可以考虑添加缓存
3. **扩展性**：可以在 `get_current_admin_user` 中添加角色检查逻辑
4. **错误处理**：所有认证错误都会返回 401 状态码 