from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)  # Markdown格式
    
    # 作者
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 关联对象 (任务或日记)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    diary_entry_id = Column(Integer, ForeignKey("diary_entries.id"), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # 关系
    author = relationship("User", back_populates="comments")
    task = relationship("Task", back_populates="comments")
    diary_entry = relationship("DiaryEntry", back_populates="comments")

    def __repr__(self):
        return f"<Comment(id={self.id}, author_id={self.author_id})>" 