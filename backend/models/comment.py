from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class Comment(Base):
    __tablename__ = "comment"
    __table_args__ = {'comment': '评论表，记录任务和日志的评论内容及关联关系'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    content = Column(Text, nullable=False, comment="评论内容(Markdown格式)")
    
    # 作者
    author_id = Column(Integer, ForeignKey("user.id"), nullable=False, comment="作者用户ID")
    
    # 关联对象 (任务)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=True, comment="关联任务ID")
    
    # 时间戳
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关系
    author = relationship("User", back_populates="comments")
    task = relationship("Task", back_populates="comments")

    def __repr__(self):
        return f"<Comment(id={self.id}, author_id={self.author_id})>" 