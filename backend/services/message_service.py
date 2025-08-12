from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from models.message import Message, MessageRecipient
from models.user import User
from api.schemas.message import MessageCreate, MessageResponse, UserNotificationResponse
from datetime import datetime

class MessageService:
    def __init__(self, db: Session):
        self.db = db

    async def create_message(self, payload: MessageCreate) -> MessageResponse:
        # 创建主消息
        msg = Message(
            type=payload.type,
            level=payload.level,
            title=payload.title,
            content=payload.content,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            actor_id=payload.actor_id,
            data_json=payload.data_json,
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)

        # 展开接收人
        if payload.recipient_user_ids:
            recipients = [
                MessageRecipient(message_id=msg.id, recipient_user_id=uid)
                for uid in payload.recipient_user_ids
            ]
            self.db.add_all(recipients)
            self.db.commit()

        return MessageResponse(
            id=msg.id,
            type=msg.type,
            level=msg.level,
            title=msg.title,
            content=msg.content,
            entity_type=msg.entity_type,
            entity_id=msg.entity_id,
            actor_id=msg.actor_id,
            data_json=msg.data_json,
            created_at=msg.created_at,
        )

    async def list_user_notifications(self, user_id: int, read: Optional[bool] = None, skip: int = 0, limit: int = 20) -> List[UserNotificationResponse]:
        stmt = select(MessageRecipient).where(MessageRecipient.recipient_user_id == user_id)
        if read is not None:
            stmt = stmt.where(MessageRecipient.read == read)
        stmt = stmt.order_by(MessageRecipient.delivered_at.desc()).offset(skip).limit(limit)
        rows = self.db.execute(stmt).scalars().all()

        result: List[UserNotificationResponse] = []
        for r in rows:
            m = r.message
            # 查询触发者名称（可空）
            actor_name = None
            if m.actor_id:
                user = self.db.get(User, m.actor_id)
                actor_name = user.name if user and user.name else None
            result.append(UserNotificationResponse(
                id=r.id,
                type=m.type,
                level=m.level,
                title=m.title,
                content=m.content,
                entity_type=m.entity_type,
                entity_id=m.entity_id,
                actor_id=m.actor_id,
                actor_name=actor_name,
                data_json=m.data_json,
                created_at=m.created_at,
                read=r.read,
                read_at=r.read_at,
                delivered_at=r.delivered_at,
            ))
        return result

    async def unread_count(self, user_id: int) -> int:
        stmt = select(MessageRecipient).where(
            MessageRecipient.recipient_user_id == user_id,
            MessageRecipient.read == False  # noqa: E712
        )
        return len(self.db.execute(stmt).scalars().all())

    async def mark_read(self, recipient_id: int, user_id: int) -> bool:
        r = self.db.get(MessageRecipient, recipient_id)
        if not r or r.recipient_user_id != user_id:
            return False
        if not r.read:
            r.read = True
            r.read_at = datetime.now()
            self.db.commit()
        return True

    async def mark_all_read(self, user_id: int) -> int:
        stmt = select(MessageRecipient).where(
            MessageRecipient.recipient_user_id == user_id,
            MessageRecipient.read == False  # noqa: E712
        )
        rows = self.db.execute(stmt).scalars().all()
        count = 0
        for r in rows:
            r.read = True
            r.read_at = datetime.now()
            count += 1
        if count:
            self.db.commit()
        return count
