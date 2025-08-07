from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CommentBase(BaseModel):
    content: str = Field(..., description="评论内容(Markdown格式)")

class CommentCreate(CommentBase):
    task_id: Optional[int] = Field(None, description="任务ID")
    diary_entry_id: Optional[int] = Field(None, description="日记ID")

class CommentUpdate(BaseModel):
    content: str = Field(..., description="评论内容(Markdown格式)")

class CommentResponse(CommentBase):
    id: int
    author_id: int
    task_id: Optional[int]
    diary_entry_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 