from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.document_comment import DocumentComment
from models.user import User
from api.schemas.document_comment import DocumentCommentCreate, DocumentCommentResponse

class DocumentCommentService:
    def __init__(self, db: Session):
        self.db = db

    async def add_comment(self, payload: DocumentCommentCreate, author_id: int) -> DocumentCommentResponse:
        comment = DocumentComment(
            content=payload.content,
            document_id=payload.document_id,
            author_id=author_id,
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return DocumentCommentResponse.model_validate(comment)

    async def list_by_document(self, document_id: int) -> List[DocumentCommentResponse]:
        # 关联查询用户信息
        stmt = select(DocumentComment, User.name, User.avatar).join(
            User, DocumentComment.author_id == User.id
        ).where(DocumentComment.document_id == document_id).order_by(DocumentComment.created_at.desc())
        
        rows = self.db.execute(stmt).all()
        comments = []
        
        for row in rows:
            comment_data = DocumentCommentResponse.model_validate(row[0])
            comment_data.author_name = row[1]  # User.name
            comment_data.author_avatar = row[2]  # User.avatar
            comments.append(comment_data)
        
        return comments

    async def delete_comment(self, comment_id: int, user_id: int) -> None:
        row = self.db.get(DocumentComment, comment_id)
        if not row:
            raise ValueError("评论不存在")
        # TODO: 权限：作者或管理员
        self.db.delete(row)
        self.db.commit()
        return None 