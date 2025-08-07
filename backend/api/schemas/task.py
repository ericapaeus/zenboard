from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskVisibility(str, Enum):
    PUBLIC = "public"
    PROJECT = "project"
    PRIVATE = "private"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskBase(BaseModel):
    title: str = Field(..., description="任务标题", max_length=200)
    description: Optional[str] = Field(None, description="任务描述")
    status: TaskStatus = Field(TaskStatus.TODO, description="任务状态")
    visibility: TaskVisibility = Field(TaskVisibility.PROJECT, description="可见性级别")
    priority: TaskPriority = Field(TaskPriority.MEDIUM, description="优先级")
    estimated_hours: Optional[int] = Field(None, description="估算工时(小时)")
    due_date: Optional[datetime] = Field(None, description="截止日期")

class TaskCreate(TaskBase):
    project_id: Optional[int] = Field(None, description="项目ID")
    parent_task_id: Optional[int] = Field(None, description="父任务ID")
    assignee_id: Optional[int] = Field(None, description="指派给的用户ID")

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, description="任务标题", max_length=200)
    description: Optional[str] = Field(None, description="任务描述")
    status: Optional[TaskStatus] = Field(None, description="任务状态")
    visibility: Optional[TaskVisibility] = Field(None, description="可见性级别")
    priority: Optional[TaskPriority] = Field(None, description="优先级")
    estimated_hours: Optional[int] = Field(None, description="估算工时(小时)")
    due_date: Optional[datetime] = Field(None, description="截止日期")
    assignee_id: Optional[int] = Field(None, description="指派给的用户ID")

class TaskResponse(TaskBase):
    id: int
    project_id: Optional[int]
    parent_task_id: Optional[int]
    creator_id: int
    assignee_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class TaskWithSubtasks(TaskResponse):
    subtasks: List["TaskResponse"] = [] 