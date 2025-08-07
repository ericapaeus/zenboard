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

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)  # Markdown格式
    
    # 可见性级别
    visibility = Column(Enum(DiaryVisibility), default=DiaryVisibility.PRIVATE, nullable=False)
    
    # 作者
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 时间戳
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 关系
    author = relationship("User", back_populates="diary_entries")
    comments = relationship("Comment", back_populates="diary_entry")

    def __repr__(self):
        return f"<DiaryEntry(id={self.id}, title='{self.title}', author_id={self.author_id})>" 