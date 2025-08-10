from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DocumentVisibility(str, Enum):
    PUBLIC = "public"
    PROJECT = "project"
    SPECIFIC = "specific"
    PRIVATE = "private"

class DocumentBase(BaseModel):
    title: str = Field(..., description="文档标题", max_length=200)
    content: str = Field(..., description="文档内容(Markdown)")
    visibility: DocumentVisibility = Field(DocumentVisibility.PRIVATE, description="可见性")

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, description="文档标题", max_length=200)
    content: Optional[str] = Field(None, description="文档内容(Markdown)")
    visibility: Optional[DocumentVisibility] = Field(None, description="可见性")

class DocumentResponse(DocumentBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentWithComments(DocumentResponse):
    comments: List["DocumentCommentResponse"] = []

from .document_comment import DocumentCommentResponse  # noqa: E402 