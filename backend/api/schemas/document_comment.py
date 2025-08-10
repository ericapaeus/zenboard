from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DocumentCommentBase(BaseModel):
    content: str = Field(..., description="评论内容(Markdown)")

class DocumentCommentCreate(DocumentCommentBase):
    document_id: int = Field(..., description="文档ID")

class DocumentCommentUpdate(BaseModel):
    content: str = Field(..., description="评论内容(Markdown)")

class DocumentCommentResponse(DocumentCommentBase):
    id: int
    author_id: int
    document_id: int
    created_at: datetime
    updated_at: datetime
    author_name: Optional[str] = Field(None, description="作者姓名")
    author_avatar: Optional[str] = Field(None, description="作者头像URL")

    class Config:
        from_attributes = True 