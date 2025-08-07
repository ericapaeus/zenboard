from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database.database import get_db
from services.wechat_service import WeChatService
from services.auth_service import AuthService
from api.schemas.response import ApiResponse
from api.schemas.wechat import WeChatQRResponse, WeChatStatusResponse, WeChatTokenResponse

router = APIRouter()
wechat_service = WeChatService()
auth_service = AuthService()


@router.post("/generate", response_model=ApiResponse[WeChatQRResponse])
async def generate_wechat_qr(db: Session = Depends(get_db)):
    """
    生成微信登录二维码
    """
    try:
        # 生成会话ID
        session_id = wechat_service.generate_session_id()
        
        # 创建登录会话
        login_session = wechat_service.create_login_session(db, session_id)
        
        # 生成二维码URL
        qr_url = wechat_service.generate_qr_url(session_id)
        
        return ApiResponse(
            success=True,
            message="二维码生成成功",
            data=WeChatQRResponse(
                session_id=session_id,
                qr_url=qr_url,
                expires_in=300  # 5分钟过期
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成二维码失败: {str(e)}")


@router.get("/callback")
async def wechat_callback(
    code: str = Query(..., description="微信授权码"),
    state: str = Query(..., description="会话ID"),
    db: Session = Depends(get_db)
):
    """
    微信回调接口 - 用户扫码后微信会调用此接口
    """
    try:
        # 通过code获取access_token
        token_info = await wechat_service.get_access_token(code)
        if not token_info or "errcode" in token_info:
            raise HTTPException(status_code=400, detail="获取微信token失败")
        
        # 获取用户信息
        user_info = await wechat_service.get_user_info(
            token_info["access_token"], 
            token_info["openid"]
        )
        if not user_info or "errcode" in user_info:
            raise HTTPException(status_code=400, detail="获取微信用户信息失败")
        
        # 获取或创建用户
        user = wechat_service.get_or_create_user(db, user_info)
        
        # 更新登录会话状态
        wechat_service.update_session_status(db, state, "used", user.id)
        
        # 返回成功页面
        return """
        <html>
        <head><title>登录成功</title></head>
        <body>
            <h1>登录成功！</h1>
            <p>请回到PC端继续操作。</p>
            <script>
                setTimeout(function() {
                    window.close();
                }, 2000);
            </script>
        </body>
        </html>
        """
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"微信登录失败: {str(e)}")


@router.get("/status", response_model=ApiResponse[WeChatStatusResponse])
async def check_login_status(
    session_id: str = Query(..., description="会话ID"),
    db: Session = Depends(get_db)
):
    """
    检查登录状态 - 前端轮询此接口
    """
    try:
        session = wechat_service.get_login_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")
        
        if session.status == "used" and session.user_id:
            # 登录成功，生成token
            token = auth_service.create_access_token(data={"sub": str(session.user_id)})
            return ApiResponse(
                success=True,
                message="登录成功",
                data=WeChatStatusResponse(
                    status="success",
                    token=token,
                    user_id=session.user_id
                )
            )
        elif session.status == "expired":
            return ApiResponse(
                success=False,
                message="二维码已过期",
                data=WeChatStatusResponse(status="expired")
            )
        else:
            return ApiResponse(
                success=True,
                message="等待扫码",
                data=WeChatStatusResponse(status="pending")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检查登录状态失败: {str(e)}")


@router.post("/token", response_model=ApiResponse[WeChatTokenResponse])
async def get_login_token(
    session_id: str = Query(..., description="会话ID"),
    db: Session = Depends(get_db)
):
    """
    获取登录token - 登录成功后调用
    """
    try:
        session = wechat_service.get_login_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")
        
        if session.status != "used" or not session.user_id:
            raise HTTPException(status_code=400, detail="会话未完成登录")
        
        # 生成token
        token = auth_service.create_access_token(data={"sub": str(session.user_id)})
        
        return ApiResponse(
            success=True,
            message="获取token成功",
            data=WeChatTokenResponse(token=token)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取token失败: {str(e)}") 