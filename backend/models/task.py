from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database.base import Base

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskVisibility(str, enum.Enum):
    PUBLIC = "public"
    PROJECT = "project"
    PRIVATE = "private"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # 任务状态
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    
    # 可见性级别
    visibility = Column(Enum(TaskVisibility), default=TaskVisibility.PROJECT, nullable=False)
    
    # 优先级: low, medium, high, urgent
    priority = Column(String(20), default="medium", nullable=False)
    
    # 估算工时(小时)
    estimated_hours = Column(Integer, nullable=True)
    
    # 外键
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)  # 公开任务可能没有项目
    parent_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)  # 子任务
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # 关系
    project = relationship("Project", back_populates="tasks")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="tasks")
    parent_task = relationship("Task", remote_side=[id], backref="subtasks")
    comments = relationship("Comment", back_populates="task")

    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>" 