from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class ProjectMembership(Base):
    __tablename__ = "project_memberships"
    __table_args__ = {'comment': '项目成员表，记录用户在项目中的角色和加入时间'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    
    # 外键
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, comment="项目ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    
    # 成员角色: owner(所有者), admin(管理员), member(成员)
    role = Column(String(20), default="member", nullable=False, comment="成员角色: owner(所有者), admin(管理员), member(成员)")
    
    # 时间戳
    joined_at = Column(DateTime, default=func.now(), comment="加入时间")
    
    # 关系
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="projects")

    def __repr__(self):
        return f"<ProjectMembership(project_id={self.project_id}, user_id={self.user_id}, role='{self.role}')>" 