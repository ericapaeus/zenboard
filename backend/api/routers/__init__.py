
from config import configure_logging, CORS_ORIGINS
from fastapi import APIRouter

# 导入所有API路由
from . import tasks, diaries, comments, wechat_auth, upload, documents, document_comments

# 创建一个主API路由器，用于聚合所有子路由
api_router = APIRouter()

# 将各个路由包含到主API路由器中
api_router.include_router(wechat_auth.router, prefix="/auth/wechat", tags=["微信认证"])
api_router.include_router(upload.router, prefix="", tags=["文件上传"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["任务管理"])
api_router.include_router(diaries.router, prefix="/diaries", tags=["日记管理"])  # 兼容旧接口
api_router.include_router(documents.router, prefix="/documents", tags=["文档管理"])
api_router.include_router(document_comments.router, prefix="/document-comments", tags=["文档评论"])
api_router.include_router(comments.router, prefix="/comments", tags=["评论管理"])  # 其他模块在用

import logging
# 在应用启动时配置日志
configure_logging()
logger = logging.getLogger(__name__)

@api_router.get("/test", tags=["测试"])
def test_api():
    logger.info("test info log from /api/test")
    return {"msg": "hello, test ok"}