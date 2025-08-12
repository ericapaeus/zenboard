from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class Project(Base):
    __tablename__ = "project"
    __table_args__ = {'comment': '项目表，存储协作项目的基本信息'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    name = Column(String(100), nullable=False, comment="项目名称")
    description = Column(Text, nullable=True, comment="项目描述")
    
    # 项目状态: active(活跃), archived(已归档)
    status = Column(String(20), default="active", nullable=False, comment="项目状态: active(活跃), archived(已归档)")
    
    # 创建者
    creator_id = Column(Integer, nullable=False, comment="创建者用户ID")
    
    # 时间戳
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    members = relationship("ProjectMembership", back_populates="project")
    tasks = relationship("Task", back_populates="project")
    documents = relationship("Document", back_populates="project")

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}')>" 