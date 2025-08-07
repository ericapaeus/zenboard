from pydantic import BaseModel
from typing import Optional


class WeChatQRResponse(BaseModel):
    """微信二维码响应"""
    session_id: str
    qr_url: str
    expires_in: int


class WeChatStatusResponse(BaseModel):
    """微信登录状态响应"""
    status: str  # pending/success/expired
    token: Optional[str] = None
    user_id: Optional[int] = None


class WeChatTokenResponse(BaseModel):
    """微信登录token响应"""
    token: str


class WeChatUserInfo(BaseModel):
    """微信用户信息"""
    openid: str
    nickname: str
    sex: Optional[int] = None
    province: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    headimgurl: Optional[str] = None
    privilege: Optional[list] = None
    unionid: Optional[str] = None 