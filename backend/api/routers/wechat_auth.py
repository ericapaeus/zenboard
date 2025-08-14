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
        # 检查邮箱唯一性（如果提供了新邮箱）
        if user_update.email and user_update.email != current_user.email:
            existing_user = db.query(User).filter(
                User.email == user_update.email,
                User.id != current_user.id
            ).first()
            if existing_user:
                return ApiResponse(
                    success=False,
                    message="该邮箱已被其他用户使用，请使用其他邮箱",
                    data=None,
                    code=400
                )
        
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

@router.get("/check-first-user", response_model=ApiResponse[dict], summary="检查是否为系统首个用户")
async def check_first_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    检查当前用户是否为系统首个用户
    如果是第一个用户，自动设置为管理员并更新状态为已通过
    """
    try:
        # 查询数据库中ID最小的用户
        first_user = db.query(User).order_by(User.id.asc()).first()
        
        if not first_user:
            # 如果数据库中没有用户，返回False
            return ApiResponse(
                success=True,
                message="查询成功",
                data={
                    "isFirstUser": False
                },
                code=200
            )
        
        # 判断当前用户是否是第一个用户（ID最小的用户）
        is_first_user = current_user.id == first_user.id
        
        # 如果是第一个用户，自动设置为管理员并更新状态
        if is_first_user:
            try:
                # 更新用户角色为管理员，状态为已通过
                current_user.role = "管理员"
                current_user.status = "已通过"
                db.commit()
                
                logger.info(f"用户 {current_user.id} 自动设置为管理员")
                
                return ApiResponse(
                    success=True,
                    message="检测到您是系统第一个用户，已自动设置为管理员！",
                    data={
                        "isFirstUser": True,
                        "autoUpgraded": True,
                        "newRole": "管理员",
                        "newStatus": "已通过"
                    },
                    code=200
                )
            except Exception as update_error:
                db.rollback()
                logger.error(f"自动升级第一个用户失败: {update_error}")
                # 即使更新失败，也返回是第一个用户的信息
                return ApiResponse(
                    success=True,
                    message="检测到您是系统第一个用户",
                    data={
                        "isFirstUser": True,
                        "autoUpgraded": False
                    },
                    code=200
                )
        
        return ApiResponse(
            success=True,
            message="查询成功",
            data={
                "isFirstUser": False
            },
            code=200
        )
    except Exception as e:
        logger.error(f"检查首个用户失败: {e}")
        return ApiResponse(
            success=False,
            message=f"检查首个用户失败: {e}",
            data=None,
            code=500
        ) 

@router.get("/user", response_model=ApiResponse[list], summary="获取用户列表")
async def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户列表，所有认证用户都可以访问，只返回已通过的用户
    """
    try:
        # 查询所有状态为"已通过"的用户
        users = db.query(User).filter(User.status == "已通过").order_by(User.id.desc()).all()
        
        # 转换为响应格式
        user_list = []
        for user in users:
            user_list.append({
                "id": user.id,
                "name": user.name,
                "phone": user.phone,
                "email": user.email,
                "role": user.role,
                "status": user.status,
                "avatar": user.avatar,
                "hire_date": user.hire_date.strftime("%Y-%m-%d") if user.hire_date else None,
                "contract_expiry": user.contract_expiry.strftime("%Y-%m-%d") if user.contract_expiry else None,
                "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else None,
                "updated_at": user.updated_at.strftime("%Y-%m-%d %H:%M:%S") if user.updated_at else None
            })
        
        return ApiResponse(
            success=True,
            message="获取用户列表成功",
            data=user_list,
            code=200
        )
    except Exception as e:
        logger.error(f"获取用户列表失败: {e}")
        return ApiResponse(
            success=False,
            message="获取用户列表失败",
            data=None,
            code=500
        )

@router.post("/user/{user_id}/approve", response_model=ApiResponse[dict], summary="审批用户")
async def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    审批用户，只有管理员可以操作
    """
    try:
        # 检查当前用户是否为管理员
        if current_user.role != "管理员":
            return ApiResponse(
                success=False,
                message="权限不足，只有管理员可以审批用户",
                data=None,
                code=403
            )
        
        # 查找要审批的用户
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return ApiResponse(
                success=False,
                message="用户不存在",
                data=None,
                code=404
            )
        
        # 更新用户状态为已通过
        user.status = "已通过"
        db.commit()
        
        return ApiResponse(
            success=True,
            message="用户审批成功",
            data={
                "user_id": user_id,
                "status": "已通过"
            },
            code=200
        )
    except Exception as e:
        logger.error(f"审批用户失败: {e}")
        return ApiResponse(
            success=False,
            message=f"审批用户失败: {e}",
            data=None,
            code=500
        )

@router.post("/user/{user_id}/reject", response_model=ApiResponse[dict], summary="拒绝用户")
async def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    拒绝用户，只有管理员可以操作
    """
    try:
        # 检查当前用户是否为管理员
        if current_user.role != "管理员":
            return ApiResponse(
                success=False,
                message="权限不足，只有管理员可以拒绝用户",
                data=None,
                code=403
            )
        
        # 查找要拒绝的用户
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return ApiResponse(
                success=False,
                message="用户不存在",
                data=None,
                code=404
            )
        
        # 更新用户状态为已拒绝
        user.status = "已拒绝"
        db.commit()
        
        return ApiResponse(
            success=True,
            message="用户已拒绝",
            data={
                "user_id": user_id,
                "status": "已拒绝"
            },
            code=200
        )
    except Exception as e:
        logger.error(f"拒绝用户失败: {e}")
        return ApiResponse(
            success=False,
            message=f"拒绝用户失败: {e}",
            data=None,
            code=500
        ) 

@router.put("/user/{user_id}", response_model=ApiResponse[UserResponse], summary="更新用户信息")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新用户信息，管理员可以更新任何用户，普通用户只能更新自己
    """
    try:
        # 检查权限：管理员可以更新任何用户，普通用户只能更新自己
        if current_user.role != "管理员" and current_user.id != user_id:
            return ApiResponse(
                success=False,
                message="权限不足，只能更新自己的信息",
                data=None,
                code=403
            )
        
        # 查找要更新的用户
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return ApiResponse(
                success=False,
                message="用户不存在",
                data=None,
                code=404
            )
        
        # 检查邮箱唯一性（如果提供了新邮箱）
        if user_update.email and user_update.email != user.email:
            existing_user = db.query(User).filter(
                User.email == user_update.email,
                User.id != user_id
            ).first()
            if existing_user:
                return ApiResponse(
                    success=False,
                    message="该邮箱已被其他用户使用，请使用其他邮箱",
                    data=None,
                    code=400
                )
        
        # 更新用户信息
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        # 更新修改时间
        from datetime import datetime
        user.updated_at = datetime.now()
        
        db.commit()
        db.refresh(user)
        
        # 返回更新后的用户信息
        return ApiResponse(
            success=True,
            message="用户信息更新成功",
            data=UserResponse.from_orm(user),
            code=200
        )
    except Exception as e:
        logger.error(f"更新用户信息失败: {e}")
        db.rollback()
        return ApiResponse(
            success=False,
            message=f"更新用户信息失败: {e}",
            data=None,
            code=500
        )

@router.delete("/user/{user_id}", response_model=ApiResponse[dict], summary="删除用户")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除用户，只有管理员可以操作，且不能删除自己
    """
    try:
        # 检查当前用户是否为管理员
        if current_user.role != "管理员":
            return ApiResponse(
                success=False,
                message="权限不足，只有管理员可以删除用户",
                data=None,
                code=403
            )
        
        # 管理员不能删除自己
        if current_user.id == user_id:
            return ApiResponse(
                success=False,
                message="不能删除自己的账户",
                data=None,
                code=400
            )
        
        # 查找要删除的用户
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return ApiResponse(
                success=False,
                message="用户不存在",
                data=None,
                code=404
            )
        
        # 删除用户
        db.delete(user)
        db.commit()
        
        return ApiResponse(
            success=True,
            message="用户删除成功",
            data={
                "user_id": user_id,
                "deleted": True
            },
            code=200
        )
    except Exception as e:
        logger.error(f"删除用户失败: {e}")
        db.rollback()
        return ApiResponse(
            success=False,
            message=f"删除用户失败: {e}",
            data=None,
            code=500
        ) 