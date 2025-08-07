from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database.base import Base

class DiaryVisibility(str, enum.Enum):
    PUBLIC = "public"
    PROJECT = "project"
    SPECIFIC = "specific"
    PRIVATE = "private"

class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    __table_args__ = {'comment': '工作日志表，记录用户的工作日志、可见性等信息'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    title = Column(String(200), nullable=False, comment="日志标题")
    content = Column(Text, nullable=False, comment="日志内容(Markdown格式)")
    visibility = Column(Enum(DiaryVisibility), default=DiaryVisibility.PRIVATE, nullable=False, comment="可见性级别: public(公开), project(项目内), specific(指定成员), private(私有)")
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="作者用户ID")
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    author = relationship("User", back_populates="diary_entries")
    comments = relationship("Comment", back_populates="diary_entry")

    def __repr__(self):
        return f"<DiaryEntry(id={self.id}, title='{self.title}', author_id={self.author_id})>" 