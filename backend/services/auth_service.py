from datetime import datetime, timedelta
from typing import Optional, Union
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from models.user import User
from api.schemas.user import Token, QRCodeResponse
import uuid
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """生成密码哈希"""
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """创建访问令牌"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[dict]:
        """验证令牌"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None

    def get_user_by_openid(self, db: Session, openid: str) -> Optional[User]:
        """通过openid获取用户"""
        return db.query(User).filter(User.openid == openid).first()

    def get_or_create_user_by_openid(self, db: Session, openid: str, name: Optional[str] = None) -> Optional[User]:
        """通过openid获取或创建用户"""
        user = self.get_user_by_openid(db, openid)
        if user:
            return user
        
        # 创建新用户
        user = User(
            nickname=name or "微信用户",
            openid=openid,
            status="active"  # 微信登录默认激活
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    async def authenticate_user(self, username: str, password: str, db: Session) -> Token:
        """用户认证"""
        user = db.query(User).filter(User.username == username).first()
        if not user or not self.verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户状态异常，请联系管理员"
            )

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def generate_qr_code(self) -> QRCodeResponse:
        """生成登录二维码"""
        session_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        
        # 这里应该将session_id存储到缓存中，暂时简化处理
        return QRCodeResponse(
            qr_code_url=f"https://app.zenith-collab.com/login?session={session_id}",
            expires_at=expires_at,
            session_id=session_id
        )

    async def verify_qr_code(self, session_id: str) -> Token:
        """验证二维码登录"""
        # 这里应该从缓存中验证session_id，暂时简化处理
        # 模拟验证成功，返回一个测试用户的token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={"sub": "1"}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    def refresh_access_token(self, refresh_token: str) -> dict:
        """刷新访问令牌"""
        try:
            payload = jwt.decode(refresh_token, self.secret_key, algorithms=[self.algorithm])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的刷新令牌"
                )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的刷新令牌"
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    async def get_current_user(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(lambda: None)  # 这里需要注入db
    ) -> User:
        """获取当前用户"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无法验证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(credentials.credentials, self.secret_key, algorithms=[self.algorithm])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        
        # 这里需要从数据库获取用户信息，暂时返回模拟数据
        # user = db.query(User).filter(User.id == int(user_id)).first()
        # if user is None:
        #     raise credentials_exception
        
        # 临时返回模拟用户数据
        from api.schemas.user import UserResponse
        return UserResponse(
            id=1,
            username="test_user",
            email="test@example.com",
            nickname="测试用户",
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ) 