import uuid
import httpx
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models.user import User
from models.login_session import LoginSession
from config import WECHAT_APP_ID, WECHAT_APP_SECRET


class WeChatService:
    def __init__(self):
        self.app_id = WECHAT_APP_ID
        self.app_secret = WECHAT_APP_SECRET
        self.base_url = "https://api.weixin.qq.com"

    def generate_session_id(self) -> str:
        """生成唯一的会话ID"""
        return str(uuid.uuid4())

    def create_login_session(self, db: Session, session_id: str) -> LoginSession:
        """创建登录会话"""
        session = LoginSession(
            session_id=session_id,
            status="pending"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_login_session(self, db: Session, session_id: str) -> Optional[LoginSession]:
        """获取登录会话"""
        return db.query(LoginSession).filter(LoginSession.session_id == session_id).first()

    def update_session_status(self, db: Session, session_id: str, status: str, user_id: Optional[int] = None):
        """更新会话状态"""
        session = self.get_login_session(db, session_id)
        if session:
            session.status = status
            if user_id:
                session.user_id = user_id
            db.commit()
            db.refresh(session)
        return session

    async def get_access_token(self, code: str) -> Optional[Dict[str, Any]]:
        """通过code获取微信access_token"""
        url = f"{self.base_url}/sns/oauth2/access_token"
        params = {
            "appid": self.app_id,
            "secret": self.app_secret,
            "code": code,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                return response.json()
        return None

    async def get_user_info(self, access_token: str, openid: str) -> Optional[Dict[str, Any]]:
        """获取微信用户信息"""
        url = f"{self.base_url}/sns/userinfo"
        params = {
            "access_token": access_token,
            "openid": openid,
            "lang": "zh_CN"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                return response.json()
        return None

    def get_or_create_user(self, db: Session, wechat_user_info: Dict[str, Any]) -> User:
        """获取或创建用户"""
        openid = wechat_user_info.get("openid")
        unionid = wechat_user_info.get("unionid")
        
        # 先通过openid查找
        user = db.query(User).filter(User.openid == openid).first()
        if user:
            return user
        
        # 再通过unionid查找
        if unionid:
            user = db.query(User).filter(User.unionid == unionid).first()
            if user:
                # 更新openid
                user.openid = openid
                db.commit()
                return user
        
        # 创建新用户
        user = User(
            nickname=wechat_user_info.get("nickname", "微信用户"),
            avatar=wechat_user_info.get("headimgurl"),
            openid=openid,
            unionid=unionid,
            status="active"  # 微信登录默认激活
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def generate_qr_url(self, session_id: str) -> str:
        """生成微信二维码URL"""
        # 这里需要根据实际的微信开放平台配置来生成
        # 示例URL格式
        redirect_uri = f"http://localhost:8000/api/auth/wechat/callback"
        state = session_id  # 使用session_id作为state参数
        
        qr_url = (
            f"https://open.weixin.qq.com/connect/qrconnect"
            f"?appid={self.app_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope=snsapi_login"
            f"&state={state}"
            f"#wechat_redirect"
        )
        return qr_url 