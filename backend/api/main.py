from contextlib import asynccontextmanager
import json
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .schemas.response import ApiResponse
# from database.database import create_tables  # 移除自动建表，改用 Alembic 迁移
from config import configure_logging, CORS_ORIGINS
import logging

# 导入 API 路由器
from .routers import api_router

# 在应用启动时配置日志
configure_logging()
logger = logging.getLogger(__name__)

# 定义 lifespan 事件处理器
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI 应用的生命周期事件处理器。
    启动时不再自动创建表，完全改为由 Alembic 迁移管理。
    """
    logger.info("Zenith FastAPI 应用启动。")
    # logger.info("--- 开始初始化数据库 ---")
    # create_tables()  # 已移除：由 Alembic 迁移管理表结构
    # logger.info("--- 数据库初始化完成 ---")

    yield
    
    # 在应用关闭时可以添加清理逻辑
    logger.info("Zenith FastAPI 应用关闭。")

app = FastAPI(
    title="Zenith API",
    description="极简团队协作系统后端API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 自定义中间件，用于在请求处理前打印请求信息
@app.middleware("http")
async def log_request_info(request: Request, call_next):
    # 尝试读取请求 body (仅限非流式 JSON 请求)
    if request.method == "POST" and "application/json" in request.headers.get("Content-Type", ""):
        try:
            body = await request.json()
            logger.info(f"Request body: {json.dumps(body, indent=2)}")
        except Exception as e:
            logger.error(f"Could not read or parse request body: {e}")

    response = await call_next(request)
    return response

# 全局异常处理器，用于捕获 HTTPException 并统一响应格式
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            code=exc.status_code,
            message=exc.detail,
            data=None,
            success=False
        ).model_dump()
    )

@app.get("/api/health", summary="健康检查接口", response_model=ApiResponse)
async def health_check(request: Request):
    """
    健康检查接口，用于判断服务是否正常运行。
    """
    return ApiResponse(
        code=200,
        message=f"Zenith服务运行正常: {request.url.path}",
        data={"status": "ok"},
        success=True
    )

# 包含 API 路由器
app.include_router(api_router, prefix="/api") 