from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, timezone, timedelta

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

class CommentBase(BaseModel):
    content: str = Field(..., description="评论内容(Markdown格式)")

class CommentCreate(CommentBase):
    task_id: Optional[int] = Field(None, description="任务ID")

class CommentUpdate(BaseModel):
    content: str = Field(..., description="评论内容(Markdown格式)")

class CommentResponse(CommentBase):
    id: int
    author_id: int
    author_name: Optional[str] = Field(None, description="作者姓名")
    task_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: convert_to_beijing_time(v).strftime("%Y-%m-%d %H:%M:%S")
        }

    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime_fields(cls, v):
        """转换时间字段为北京时间"""
        if isinstance(v, datetime):
            return convert_to_beijing_time(v)
        return v 