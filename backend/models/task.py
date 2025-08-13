from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database.base import Base

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Task(Base):
    __tablename__ = "task"
    __table_args__ = {'comment': '任务表，记录项目任务、分配、优先级等信息'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    title = Column(String(200), nullable=False, comment="任务标题")
    content = Column(Text, nullable=True, comment="任务内容")
    
    # 优先级
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False, comment="优先级: low(低), medium(中), high(高)")
    
    # 子任务数据（JSON格式）
    subtasks = Column(JSON, nullable=True, comment="子任务数据，JSON格式存储")
    
    # 外键
    project_id = Column(Integer, ForeignKey("project.id"), nullable=True, comment="所属项目ID")
    creator_id = Column(Integer, ForeignKey("user.id"), nullable=False, comment="创建者用户ID")
    assignee_id = Column(Integer, ForeignKey("user.id"), nullable=True, comment="任务负责人ID")
    
    # 时间戳
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")
    start_date = Column(DateTime, nullable=True, comment="开始时间")
    end_date = Column(DateTime, nullable=True, comment="结束时间")
    due_date = Column(DateTime, nullable=True, comment="截止日期")
    completed_at = Column(DateTime, nullable=True, comment="完成时间")
    
    # 关系
    project = relationship("Project", back_populates="tasks")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")
    comments = relationship("Comment", back_populates="task")

    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', priority='{self.priority}')>" 