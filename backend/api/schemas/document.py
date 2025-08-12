from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DocumentBase(BaseModel):
    title: str = Field(..., description="文档标题", max_length=200)
    content: str = Field(..., description="文档内容(Markdown)")
    project_id: Optional[int] = Field(None, description="所属项目ID")
    user_ids: Optional[List[int]] = Field(None, description="指定用户ID列表")

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, description="文档标题", max_length=200)
    content: Optional[str] = Field(None, description="文档内容(Markdown)")
    project_id: Optional[int] = Field(None, description="所属项目ID")
    user_ids: Optional[List[int]] = Field(None, description="指定用户ID列表")

class DocumentResponse(DocumentBase):
    id: int
    author_id: int
    specific_user_ids: Optional[List[int]] = Field(None, description="指定用户ID列表")
    created_at: datetime
    updated_at: datetime

class DocumentWithComments(DocumentResponse):
    comments: List['DocumentCommentResponse'] = []

class DocumentCommentBase(BaseModel):
    content: str = Field(..., description="评论内容(Markdown)")

class DocumentCommentCreate(DocumentCommentBase):
    document_id: int = Field(..., description="文档ID")

class DocumentCommentUpdate(DocumentCommentBase):
    pass

class DocumentCommentResponse(DocumentCommentBase):
    id: int
    document_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

# 解决循环引用
DocumentCommentResponse.model_rebuild()