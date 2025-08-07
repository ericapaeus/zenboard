from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DiaryVisibility(str, Enum):
    PUBLIC = "public"
    PROJECT = "project"
    SPECIFIC = "specific"
    PRIVATE = "private"

class DiaryBase(BaseModel):
    title: str = Field(..., description="日记标题", max_length=200)
    content: str = Field(..., description="日记内容(Markdown格式)")
    visibility: DiaryVisibility = Field(DiaryVisibility.PRIVATE, description="可见性级别")

class DiaryCreate(DiaryBase):
    pass

class DiaryUpdate(BaseModel):
    title: Optional[str] = Field(None, description="日记标题", max_length=200)
    content: Optional[str] = Field(None, description="日记内容(Markdown格式)")
    visibility: Optional[DiaryVisibility] = Field(None, description="可见性级别")

class DiaryResponse(DiaryBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DiaryWithComments(DiaryResponse):
    comments: List["CommentResponse"] = [] 