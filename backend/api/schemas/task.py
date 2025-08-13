from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from enum import Enum

# 定义北京时间时区
BEIJING_TIMEZONE = timezone(timedelta(hours=8))

def convert_to_beijing_time(dt: datetime) -> datetime:
    """将datetime对象转换为北京时间"""
    if dt is None:
        return dt
    
    # 如果没有时区信息，假设为UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    # 转换为北京时间
    return dt.astimezone(BEIJING_TIMEZONE)

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class SubtaskCreate(BaseModel):
    title: str = Field(..., description="子任务标题")
    content: Optional[str] = Field(None, description="子任务内容")
    assignee_id: Optional[int] = Field(None, description="子任务处理人ID")

class SubtaskResponse(BaseModel):
    id: str = Field(..., description="子任务ID")
    title: str = Field(..., description="子任务标题")
    content: Optional[str] = Field(None, description="子任务内容")
    assignee_id: Optional[int] = Field(None, description="子任务处理人ID")
    assignee: Optional[str] = Field(None, description="子任务处理人姓名")  # 保持向后兼容
    created_at: str = Field(..., description="创建时间")

class TaskBase(BaseModel):
    title: str = Field(..., description="任务标题", max_length=200)
    content: Optional[str] = Field(None, description="任务内容")
    priority: TaskPriority = Field(TaskPriority.MEDIUM, description="优先级")
    start_date: Optional[datetime] = Field(None, description="开始日期")
    end_date: Optional[datetime] = Field(None, description="结束日期")

class TaskCreate(TaskBase):
    project_id: Optional[int] = Field(None, description="项目ID")
    assignee_id: Optional[int] = Field(None, description="指派给的用户ID")
    subtasks: Optional[List[SubtaskCreate]] = Field(None, description="子任务列表")

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, description="任务标题", max_length=200)
    content: Optional[str] = Field(None, description="任务内容")
    priority: Optional[TaskPriority] = Field(None, description="优先级")
    start_date: Optional[datetime] = Field(None, description="开始日期")
    end_date: Optional[datetime] = Field(None, description="结束日期")
    project_id: Optional[int] = Field(None, description="项目ID")
    assignee_id: Optional[int] = Field(None, description="指派给的用户ID")
    subtasks: Optional[List[SubtaskCreate]] = Field(None, description="子任务列表")

class TaskResponse(TaskBase):
    id: int
    project_id: Optional[int]
    creator_id: int
    assignee_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    subtasks: Optional[List[SubtaskResponse]] = Field(default=[], description="子任务列表")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: convert_to_beijing_time(v).strftime("%Y-%m-%d %H:%M:%S")
        }

    @field_validator('created_at', 'updated_at', 'start_date', 'end_date', mode='before')
    @classmethod
    def convert_datetime_fields(cls, v):
        """转换时间字段为北京时间"""
        if isinstance(v, datetime):
            return convert_to_beijing_time(v)
        return v

class TaskWithSubtasks(TaskResponse):
    pass 