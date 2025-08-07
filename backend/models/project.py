from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # 项目状态: active(活跃), archived(已归档)
    status = Column(String(20), default="active", nullable=False)
    
    # 项目颜色标识
    color = Column(String(7), default="#1890ff", nullable=False)  # hex color
    
    # 创建者
    creator_id = Column(Integer, nullable=False)
    
    # 时间戳
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 关系
    members = relationship("ProjectMembership", back_populates="project")
    tasks = relationship("Task", back_populates="project")

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}')>" 