from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base


class Message(Base):
    __tablename__ = "message"
    __table_args__ = {"comment": "系统消息主表，描述消息事件本身"}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")

    # 消息定义
    type = Column(String(50), nullable=False, comment="消息类型")
    level = Column(String(20), nullable=False, server_default="info", comment="级别: info|warning|error")
    title = Column(String(200), nullable=False, comment="标题")
    content = Column(Text, nullable=True, comment="人类可读说明")

    # 关联实体（用于跳转、筛选）
    entity_type = Column(String(30), nullable=True, comment="关联实体类型: contract|document|task|project")
    entity_id = Column(Integer, nullable=True, comment="关联实体ID")

    # 触发者
    actor_id = Column(Integer, ForeignKey("user.id", name="fk_message_actor_user"), nullable=True, comment="触发者用户ID，系统产生可为空")

    # 结构化上下文
    data_json = Column(Text, nullable=True, comment="结构化上下文JSON")

    # 时间
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")

    # 关系
    message_recipients = relationship(
        "MessageRecipient",
        back_populates="message",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    actor = relationship("User", back_populates="messages")


class MessageRecipient(Base):
    __tablename__ = "message_recipient"
    __table_args__ = {"comment": "消息接收关系表，记录每个接收人的投递与已读状态"}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")

    message_id = Column(
        Integer,
        ForeignKey("message.id", name="fk_message_recipient_message", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="消息ID",
    )
    recipient_user_id = Column(Integer, ForeignKey("user.id", name="fk_message_recipient_user"), nullable=False, index=True, comment="接收人用户ID")

    read = Column(Boolean, nullable=False, server_default="0", index=True, comment="是否已读")
    read_at = Column(DateTime, nullable=True, comment="已读时间")
    delivered_at = Column(DateTime, server_default=func.now(), comment="投递时间")
    deleted = Column(Boolean, nullable=False, server_default="0", comment="是否删除")

    # 关系
    message = relationship("Message", back_populates="message_recipients")
    user = relationship("User", back_populates="message_recipients")
