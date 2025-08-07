from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class ProjectMembership(Base):
    __tablename__ = "project_memberships"

    id = Column(Integer, primary_key=True, index=True)
    
    # 外键
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 成员角色: owner(所有者), admin(管理员), member(成员)
    role = Column(String(20), default="member", nullable=False)
    
    # 时间戳
    joined_at = Column(DateTime, default=func.now())
    
    # 关系
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="projects")

    def __repr__(self):
        return f"<ProjectMembership(project_id={self.project_id}, user_id={self.user_id}, role='{self.role}')>" 