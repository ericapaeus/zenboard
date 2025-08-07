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
    __table_args__ = {'comment': '任务表，记录项目任务、分配、状态等信息'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    title = Column(String(200), nullable=False, comment="任务标题")
    description = Column(Text, nullable=True, comment="任务描述")
    
    # 任务状态
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False, comment="任务状态: todo(待办), in_progress(进行中), done(已完成)")
    
    # 可见性级别
    visibility = Column(Enum(TaskVisibility), default=TaskVisibility.PROJECT, nullable=False, comment="可见性级别: public(公开), project(项目内), private(私有)")
    
    # 优先级: low, medium, high, urgent
    priority = Column(String(20), default="medium", nullable=False, comment="优先级: low, medium, high, urgent")
    
    # 估算工时(小时)
    estimated_hours = Column(Integer, nullable=True, comment="估算工时(小时)")
    
    # 外键
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, comment="所属项目ID(公开任务可能没有项目)")  # 公开任务可能没有项目
    parent_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, comment="父任务ID(子任务)")  # 子任务
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者用户ID")
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="被分配人用户ID")
    
    # 时间戳
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")
    due_date = Column(DateTime, nullable=True, comment="截止日期")
    completed_at = Column(DateTime, nullable=True, comment="完成时间")
    
    # 关系
    project = relationship("Project", back_populates="tasks")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="tasks")
    parent_task = relationship("Task", remote_side=[id], backref="subtasks")
    comments = relationship("Comment", back_populates="task")

    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>" 