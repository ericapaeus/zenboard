from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class MessageBase(BaseModel):
    type: str = Field(..., description="消息类型")
    level: str = Field("info", description="消息级别: info|warning|error")
    title: str = Field(..., max_length=200, description="标题")
    content: Optional[str] = Field(None, description="人类可读说明")
    entity_type: Optional[str] = Field(None, description="关联实体类型: contract|document|task|project")
    entity_id: Optional[int] = Field(None, description="关联实体ID")
    actor_id: Optional[int] = Field(None, description="触发者用户ID")
    data_json: Optional[str] = Field(None, description="结构化上下文JSON")

class MessageCreate(MessageBase):
    # 接收人列表，创建时用于展开message_recipient
    recipient_user_ids: List[int] = Field(default_factory=list, description="接收人用户ID列表")

class MessageResponse(MessageBase):
    id: int
    created_at: datetime

class MessageRecipientResponse(BaseModel):
    id: int
    message_id: int
    recipient_user_id: int
    read: bool
    read_at: Optional[datetime]
    delivered_at: datetime

class UserNotificationResponse(BaseModel):
    id: int
    # 展平常用字段，便于前端展示
    type: str
    level: str
    title: str
    content: Optional[str]
    entity_type: Optional[str]
    entity_id: Optional[int]
    actor_id: Optional[int]
    data_json: Optional[str]
    created_at: datetime
    read: bool
    read_at: Optional[datetime]
    delivered_at: datetime
