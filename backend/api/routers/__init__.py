
from config import configure_logging, CORS_ORIGINS
from fastapi import APIRouter

# 导入所有API路由
from . import auth, tasks, diaries, comments, wechat_auth

# 创建一个主API路由器，用于聚合所有子路由
api_router = APIRouter()

# 将各个路由包含到主API路由器中
api_router.include_router(auth.router, prefix="/api/auth", tags=["认证"])
api_router.include_router(wechat_auth.router, prefix="/api/auth/wechat", tags=["微信认证"])
api_router.include_router(tasks.router, prefix="/api/tasks", tags=["任务管理"])
api_router.include_router(diaries.router, prefix="/api/diaries", tags=["日记管理"])
api_router.include_router(comments.router, prefix="/api/comments", tags=["评论管理"])

import logging
# 在应用启动时配置日志
configure_logging()
logger = logging.getLogger(__name__)

@api_router.get("/api/test", tags=["测试"])
def test_api():
    logger.info("test info log from /api/test")
    return {"msg": "hello, test ok"}