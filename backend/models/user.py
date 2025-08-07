from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=True)  # 改为可空，微信登录可能没有用户名
    email = Column(String(100), unique=True, index=True, nullable=True)    # 改为可空
    nickname = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=True)  # 改为可空，微信登录不需要密码
    
    # 微信相关字段
    openid = Column(String(64), unique=True, index=True, nullable=True)
    unionid = Column(String(64), unique=True, index=True, nullable=True)
    avatar = Column(String(500), nullable=True)
    
    # 用户状态: pending(待审批), active(已激活), inactive(已禁用)
    status = Column(String(20), default="pending", nullable=False)
    
    # 合同管理
    hire_date = Column(DateTime, nullable=True)
    contract_expiry = Column(DateTime, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 关系
    projects = relationship("ProjectMembership", back_populates="user")
    tasks = relationship("Task", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="Task.creator_id", back_populates="creator")
    diary_entries = relationship("DiaryEntry", back_populates="author")
    comments = relationship("Comment", back_populates="author")
    login_sessions = relationship("LoginSession", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, nickname='{self.nickname}', openid='{self.openid}')>" 