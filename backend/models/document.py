from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class Document(Base):
    __tablename__ = "document"
    __table_args__ = {'comment': '文档表，记录用户创建的文档及可见性'}

    id = Column(Integer, primary_key=True, index=True, comment="主键ID")
    title = Column(String(200), nullable=False, comment="文档标题")
    content = Column(Text, nullable=False, comment="文档内容(Markdown)")
    project_id = Column(Integer, ForeignKey("project.id"), nullable=True, comment="所属项目ID，为空表示不属于任何项目")
    specific_user_ids = Column(JSON, nullable=True, comment="指定可见用户ID列表，为空表示所有用户可见")
    author_id = Column(Integer, ForeignKey("user.id"), nullable=False, comment="作者用户ID")
    created_at = Column(DateTime, default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="更新时间")

    author = relationship("User", back_populates="documents", lazy="joined")
    project = relationship("Project", back_populates="documents", lazy="joined")
    comments = relationship("DocumentComment", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, title='{self.title}', author_id={self.author_id})>" 