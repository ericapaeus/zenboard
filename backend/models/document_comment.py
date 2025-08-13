from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class DocumentComment(Base):
    __tablename__ = "document_comment"
    __table_args__ = {'comment': '文档评论表（独立于通用评论），关联 document'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    content = Column(Text, nullable=False, comment="评论内容(Markdown)")
    document_id = Column(Integer, ForeignKey("document.id"), nullable=False, index=True, comment="文档ID")
    author_id = Column(Integer, ForeignKey("user.id"), nullable=False, comment="作者用户ID")
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    document = relationship("Document", back_populates="comments")
    author = relationship("User", back_populates="document_comments")

    def __repr__(self) -> str:
        return f"<DocumentComment(id={self.id}, document_id={self.document_id}, author_id={self.author_id})>" 