from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.database import get_db
from api.schemas.response import ApiResponse
from api.schemas.user import UserLogin, Token, QRCodeResponse
from services.auth_service import AuthService
from services.user_service import UserService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=ApiResponse[Token], summary="用户登录")
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    用户登录接口
    """
    try:
        auth_service = AuthService(db)
        token = await auth_service.authenticate_user(
            user_credentials.username, 
            user_credentials.password
        )
        return ApiResponse(
            code=200,
            message="登录成功",
            data=token,
            success=True
        )
    except Exception as e:
        logger.error(f"登录失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

@router.post("/qr-code", response_model=ApiResponse[QRCodeResponse], summary="生成登录二维码")
async def generate_qr_code(db: Session = Depends(get_db)):
    """
    生成登录二维码接口
    """
    try:
        auth_service = AuthService(db)
        qr_data = await auth_service.generate_qr_code()
        return ApiResponse(
            code=200,
            message="二维码生成成功",
            data=qr_data,
            success=True
        )
    except Exception as e:
        logger.error(f"生成二维码失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="生成二维码失败"
        )

@router.post("/qr-code/verify", response_model=ApiResponse[Token], summary="验证二维码")
async def verify_qr_code(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    验证二维码登录接口
    """
    try:
        auth_service = AuthService(db)
        token = await auth_service.verify_qr_code(session_id)
        return ApiResponse(
            code=200,
            message="二维码验证成功",
            data=token,
            success=True
        )
    except Exception as e:
        logger.error(f"二维码验证失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="二维码验证失败或已过期"
        )

@router.post("/refresh", response_model=ApiResponse[Token], summary="刷新访问令牌")
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    刷新访问令牌接口
    """
    try:
        auth_service = AuthService(db)
        token = await auth_service.refresh_token(credentials.credentials)
        return ApiResponse(
            code=200,
            message="令牌刷新成功",
            data=token,
            success=True
        )
    except Exception as e:
        logger.error(f"令牌刷新失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌刷新失败"
        ) 