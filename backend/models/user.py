from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class User(Base):
    __tablename__ = "user"
    __table_args__ = {'comment': '用户表，存储系统用户的基本信息和微信相关信息'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    email = Column(String(100), unique=True, index=True, nullable=True, comment="邮箱（可空）")
    
    # 基本信息
    name = Column(String(50), nullable=True, comment="姓名")
    phone = Column(String(20), nullable=True, comment="手机号")

    # 角色：普通用户/管理员（数据库默认值）
    role = Column(String(20), server_default='普通用户', nullable=False, comment="角色: 普通用户|管理员")
    
    # 微信相关字段
    openid = Column(String(64), unique=True, index=True, nullable=True, comment="微信openid")
    avatar = Column(String(500), nullable=True, comment="头像URL")
    
    # 用户状态（数据库默认值）
    status = Column(String(20), server_default='未审核', nullable=False, comment="用户状态: pending(未审核), active(已通过), inactive(已拒绝)")
    
    # 合同管理
    hire_date = Column(DateTime, nullable=True, comment="入职日期")
    contract_expiry = Column(DateTime, nullable=True, comment="合同到期日期")
    
    # 时间戳
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    project_membership = relationship("ProjectMembership", back_populates="user")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="Task.creator_id", back_populates="creator")
    comments = relationship("Comment", back_populates="author")
    documents = relationship("Document", back_populates="author", cascade="all, delete-orphan")
    document_comments = relationship("DocumentComment", back_populates="author")
    messages = relationship("Message", back_populates="actor")
    message_recipients = relationship("MessageRecipient", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, openid='{self.openid}')>" 