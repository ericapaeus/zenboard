from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class ProjectMembership(Base):
    __tablename__ = "project_membership"
    __table_args__ = (
        UniqueConstraint('project_id', 'user_id', name='unique_project_user'),
        {'comment': '项目成员表，记录用户在项目中的角色和加入时间'}
    )

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    
    # 外键 - 使用单数形式表名并添加约束名称
    project_id = Column(Integer, ForeignKey("project.id", name="fk_project_membership_project"), nullable=False, comment="项目ID")
    user_id = Column(Integer, ForeignKey("user.id", name="fk_project_membership_user"), nullable=False, comment="用户ID")
    
    # 成员角色: owner(所有者), admin(管理员), member(成员)
    role = Column(String(20), default="member", nullable=False, comment="成员角色: owner(所有者), admin(管理员), member(成员)")
    
    # 时间戳
    joined_at = Column(DateTime, default=func.now(), comment="加入时间")
    
    # 关系
    project = relationship("Project", back_populates="project_membership")
    user = relationship("User", back_populates="project_membership")

    def __repr__(self):
        return f"<ProjectMembership(project_id={self.project_id}, user_id={self.user_id}, role='{self.role}')>" 