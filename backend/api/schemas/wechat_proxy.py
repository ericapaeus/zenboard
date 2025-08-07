from pydantic import BaseModel
from typing import Optional


class WechatAuthData(BaseModel):
    """微信认证数据"""
    key: Optional[str] = None
    url: Optional[str] = None
    openid: Optional[str] = None
    name: Optional[str] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    refresh_token: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求"""
    refresh_token: str


class WechatLoginRequest(BaseModel):
    """微信登录请求"""
    redirect: Optional[str] = None


class WechatStatusResponse(BaseModel):
    """微信状态响应"""
    status: str  # pending/success/expired
    key: Optional[str] = None
    url: Optional[str] = None 