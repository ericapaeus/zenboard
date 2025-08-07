import os
import logging
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zenboard.db")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# WeChat Proxy Configuration (参考datagentic项目)
AUTH_API_KEY = os.getenv("AUTH_API_KEY", "your-auth-api-key")
AUTH_API_BASE_URL = os.getenv("AUTH_API_BASE_URL", "https://your-auth-service.com")


# QR Code Configuration
QR_CODE_EXPIRE_MINUTES = int(os.getenv("QR_CODE_EXPIRE_MINUTES", "5"))

# File Upload Configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

def configure_logging():
    """
    统一配置应用程序的日志。
    """
    # 获取根 logger
    root_logger = logging.getLogger()
    root_logger.setLevel(LOG_LEVEL)

    # 避免重复添加处理器
    if not root_logger.handlers:
        # 创建一个 StreamHandler，用于输出到控制台
        console_handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

    # 设置 SQLAlchemy 的日志级别，避免其输出过多信息
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",  # 添加前端端口
    "https://app.zenith-collab.com",
]

# Pagination Configuration
DEFAULT_PAGE_SIZE = int(os.getenv("DEFAULT_PAGE_SIZE", "20"))
MAX_PAGE_SIZE = int(os.getenv("MAX_PAGE_SIZE", "100")) 