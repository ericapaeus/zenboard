from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi import HTTPException, status
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from models.user import User
from api.schemas.user import UserStatus
import logging

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

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

    def get_user_by_openid(self, db: Session, openid: str) -> Optional[User]:
        """通过 openid 获取用户"""
        return db.query(User).filter(User.openid == openid).first()

    def get_or_create_user_by_openid(self, db: Session, openid: str, name: Optional[str] = None) -> Optional[User]:
        """通过 openid 获取或创建用户"""
        user = self.get_user_by_openid(db, openid)
        if user:
            return user

        # 创建新用户（微信登录默认为未审核状态）
        user = User(
            openid=openid,
            status=UserStatus.PENDING,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def refresh_access_token(self, refresh_token: str) -> dict:
        """刷新访问令牌（根据 refresh_token 生成新的 access_token）"""
        try:
            payload = jwt.decode(refresh_token, self.secret_key, algorithms=[self.algorithm])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的刷新令牌",
                )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的刷新令牌",
            )

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self.create_access_token(data={"sub": user_id}, expires_delta=access_token_expires)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        } 