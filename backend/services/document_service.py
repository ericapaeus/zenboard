from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.document import Document, DocumentVisibility
from api.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse, DocumentWithComments
from models.document_comment import DocumentComment
import logging

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self, db: Session):
        self.db = db

    async def create_document(self, payload: DocumentCreate, author_id: int) -> DocumentResponse:
        document = Document(
            title=payload.title,
            content=payload.content,
            visibility=DocumentVisibility(payload.visibility),
            author_id=author_id,
        )
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return DocumentResponse.model_validate(document)

    async def get_documents(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        author_id: Optional[int] = None,
        visibility: Optional[str] = None,
    ) -> List[DocumentResponse]:
        stmt = select(Document)
        if author_id is not None:
            stmt = stmt.where(Document.author_id == author_id)
        if visibility is not None:
            stmt = stmt.where(Document.visibility == DocumentVisibility(visibility))
        stmt = stmt.offset(skip).limit(limit)
        rows = self.db.execute(stmt).scalars().all()
        return [DocumentResponse.model_validate(row) for row in rows]

    async def get_document(self, document_id: int, user_id: int) -> DocumentWithComments:
        row = self.db.get(Document, document_id)
        if not row:
            raise ValueError("文档不存在")
        # TODO: 权限控制（可见性）
        return DocumentWithComments.model_validate(row)

    async def update_document(self, document_id: int, payload: DocumentUpdate, user_id: int) -> DocumentResponse:
        row = self.db.get(Document, document_id)
        if not row:
            raise ValueError("文档不存在")
        # TODO: 权限控制（作者或管理员）
        if payload.title is not None:
            row.title = payload.title
        if payload.content is not None:
            row.content = payload.content
        if payload.visibility is not None:
            row.visibility = DocumentVisibility(payload.visibility)
        self.db.commit()
        self.db.refresh(row)
        return DocumentResponse.model_validate(row)

    async def delete_document(self, document_id: int, user_id: int) -> None:
        row = self.db.get(Document, document_id)
        if not row:
            raise ValueError("文档不存在")
        # TODO: 权限控制（作者或管理员）
        self.db.delete(row)
        self.db.commit()
        return None 