from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base


class LoginSession(Base):
    __tablename__ = "login_sessions"
    __table_args__ = {'comment': '用户登录会话表，记录扫码/登录等会话信息'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    session_id = Column(String(64), unique=True, index=True, nullable=False, comment="会话唯一ID")
    status = Column(String(20), default="pending", comment="会话状态：pending/used/expired")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="关联用户ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关联用户
    user = relationship("User", back_populates="login_sessions") 