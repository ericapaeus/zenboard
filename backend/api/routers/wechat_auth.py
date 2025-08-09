from fastapi import APIRouter, Depends, HTTPException, status
import httpx
import os
import logging
from config import AUTH_API_KEY, AUTH_API_BASE_URL
from sqlalchemy.orm import Session
from database.database import get_db
from services.auth_service import AuthService
from api.schemas.response import ApiResponse
from api.schemas.wechat_proxy import WechatAuthData, RefreshTokenRequest
from api.schemas.user import UserResponse, UserUpdate, UserStatus
from models.user import User
from api.dependencies import get_current_user
from services.user_service import UserService
from typing import Optional

router = APIRouter(tags=["微信认证"])
logger = logging.getLogger(__name__)

# 确保AUTH_API_KEY和AUTH_API_BASE_URL已配置
if not AUTH_API_KEY or not AUTH_API_BASE_URL:
    raise ValueError("AUTH_API_KEY and AUTH_API_BASE_URL must be set in environment variables.")


@router.post("/generate", response_model=ApiResponse[WechatAuthData], summary="生成微信登录凭据")
async def generate_wechat_login_credentials(redirect: str | None = None):
    """
    获取微信登录凭据（包含登录 URL 和会话 Key）。
    """
    api_url = f"{AUTH_API_BASE_URL}/auth/generate"
    logger.info(f"请求上游API URL: {api_url}")

    headers = {"x-api-key": AUTH_API_KEY}
    payload = {}
    if redirect:
        payload["redirect"] = redirect

    logger.info("==============")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, headers=headers, json=payload)
            response.raise_for_status()
            response_data = response.json()
            logger.info(f"上游API响应: {response_data}")
            return ApiResponse(
                success=response_data.get("success", True),
                message=response_data.get("message", "Success"),
                data=WechatAuthData(**response_data.get("data", {})),
                code=response_data.get("code", 200)
            )
    except httpx.HTTPStatusError as e:
        return ApiResponse(code=e.response.status_code, success=False, message=f"上游API返回错误: {e.response.text}")
    except httpx.RequestError as e:
        return ApiResponse(code=500, success=False, message=f"请求上游API失败: {e}")
    except Exception as e:
        return ApiResponse(code=500, success=False, message=f"生成微信登录凭据失败: {str(e)}")


@router.get("/status/{key}", response_model=ApiResponse[WechatAuthData], summary="检查微信扫码登录状态")
async def get_wechat_login_status(key: str):
    """
    检查用户扫码登录状态。
    """
    api_url = f"{AUTH_API_BASE_URL}/auth/status/{key}"
    logger.info(f"请求上游API URL: {api_url}")
    logger.info(f"检查的key: {key}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(api_url)
            logger.info(f"上游API响应状态码: {response.status_code}")
            response.raise_for_status()
            response_data = response.json()
            logger.info(f"上游API响应数据: {response_data}")
            return ApiResponse(
                success=response_data.get("success", True),
                message=response_data.get("message", "Success"),
                data=WechatAuthData(**response_data.get("data", {})),
                code=response_data.get("code", 200)
            )
    except httpx.HTTPStatusError as e:
        logger.error(f"上游API HTTP错误: {e.response.status_code} - {e.response.text}")
        return ApiResponse(code=e.response.status_code, success=False, message=f"上游API返回错误: {e.response.text}")
    except httpx.RequestError as e:
        logger.error(f"请求上游API失败: {e}")
        return ApiResponse(code=500, success=False, message=f"请求上游API失败: {e}")
    except Exception as e:
        logger.error(f"检查登录状态失败: {str(e)}")
        return ApiResponse(code=500, success=False, message=f"检查登录状态失败: {str(e)}")


@router.get("/openid", response_model=ApiResponse[dict], summary="微信登录获取OpenID")
async def get_openid(code: str, db: Session = Depends(get_db)):
    """
    通过微信授权码获取OpenID并完成登录。
    """
    try:
        auth_service = AuthService()
        
        # 调用微信 API 获取真实的 openid
        api_url = f"{AUTH_API_BASE_URL}/auth/openid"
        headers = {"x-api-key": AUTH_API_KEY}
        params = {"code": code}

        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, headers=headers, params=params)
            response.raise_for_status()
            response_data = response.json()
            
            if not response_data.get("success"):
                raise HTTPException(status_code=400, detail="微信API返回错误")
            
            openid = response_data.get("data", {}).get("openid")
            if not openid:
                raise HTTPException(status_code=400, detail="未能从微信API获取到openid")

        # 获取或创建用户
        user = auth_service.get_or_create_user_by_openid(db, openid)
        if not user:
            raise HTTPException(status_code=400, detail="用户创建失败")

        # 创建访问令牌
        access_token = auth_service.create_access_token(data={"sub": str(user.id)})
            
        return ApiResponse(
            success=True,
            message="登录成功",
            data={"access_token": access_token, "token_type": "bearer"},
            code=200
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"微信API HTTP错误: {e.response.status_code} - {e.response.text}")
        return ApiResponse(
            success=False,
            message=f"微信API返回错误: {e.response.text}",
            data=None,
            code=e.response.status_code
        )
    except httpx.RequestError as e:
        logger.error(f"请求微信API失败: {e}")
        return ApiResponse(
            success=False,
            message=f"请求微信API失败: {e}",
            data=None,
            code=500
        )
    except Exception as e:
        logger.error(f"获取用户OpenID失败: {e}")
        return ApiResponse(
            success=False,
            message=f"获取用户OpenID失败: {e}",
            data=None,
            code=500
        )


@router.post("/refresh", response_model=ApiResponse[dict], summary="刷新令牌")
async def refresh_token(
    request: RefreshTokenRequest, 
    db: Session = Depends(get_db)
):
    """
    使用刷新令牌获取新的访问令牌和刷新令牌。
    """
    try:
        auth_service = AuthService()
        token_data = auth_service.refresh_access_token(request.refresh_token)
        return ApiResponse(
            success=True,
            message="Token refreshed successfully",
            data=token_data,
            code=200
        )
    except HTTPException as e:
        return ApiResponse(code=e.status_code, success=False, message=e.detail)
    except Exception as e:
        return ApiResponse(code=500, success=False, message=f"刷新令牌失败: {e}")


@router.get("/me", response_model=ApiResponse[UserResponse], summary="获取当前登录用户信息")
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前登录用户信息。
    """
    try:
        return ApiResponse(
            success=True,
            message="Success",
            data=UserResponse(
                id=current_user.id,
                email=(current_user.email if current_user.email else None),
                name=current_user.name,
                phone=current_user.phone,
                role=current_user.role,
                status=current_user.status,
                avatar=current_user.avatar,
                hire_date=current_user.hire_date,
                contract_expiry=current_user.contract_expiry,
                created_at=current_user.created_at,
                updated_at=current_user.updated_at
            ),
            code=200
        )
    except Exception as e:
        logger.error(f"获取用户信息失败: {e}")
        return ApiResponse(
            success=False,
            message=f"获取用户信息失败: {e}",
            data=None,
            code=500
        )

@router.put("/profile", response_model=ApiResponse[UserResponse], summary="更新用户资料")
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新当前用户的资料。
    """
    try:
        user_service = UserService(db)
        updated_user = await user_service.update_user(current_user.id, user_update)
        
        return ApiResponse(
            success=True,
            message="资料更新成功",
            data=updated_user,
            code=200
        )
    except Exception as e:
        logger.error(f"更新用户资料失败: {e}")
        return ApiResponse(
            success=False,
            message=f"更新用户资料失败: {e}",
            data=None,
            code=500
        ) 