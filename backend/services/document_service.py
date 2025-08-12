from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.document import Document
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
            project_id=payload.project_id,
            specific_user_ids=payload.user_ids,  # 将 user_ids 存储到 specific_user_ids
            author_id=author_id,
        )
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        
        # 手动构建响应数据，确保字段匹配
        return DocumentResponse(
            id=document.id,
            title=document.title,
            content=document.content,
            project_id=document.project_id,
            user_ids=document.specific_user_ids,  # 将 specific_user_ids 映射回 user_ids
            author_id=document.author_id,
            created_at=document.created_at,
            updated_at=document.updated_at
        )

    async def get_documents(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        author_id: Optional[int] = None,
        project_id: Optional[int] = None,
        order_by: Optional[str] = None,
    ) -> List[DocumentResponse]:
        try:
            logger.info(f"开始获取文档列表: user_id={user_id}, skip={skip}, limit={limit}, author_id={author_id}, project_id={project_id}, order_by={order_by}")
            
            stmt = select(Document)
            if author_id is not None:
                stmt = stmt.where(Document.author_id == author_id)
            if project_id is not None:
                stmt = stmt.where(Document.project_id == project_id)
            
            # 处理排序
            if order_by:
                if order_by.startswith('-'):
                    # 降序排序
                    field_name = order_by[1:]
                    if hasattr(Document, field_name):
                        field = getattr(Document, field_name)
                        stmt = stmt.order_by(field.desc())
                        logger.info(f"应用降序排序: {field_name}")
                    else:
                        logger.warning(f"未知的排序字段: {field_name}")
                else:
                    # 升序排序
                    if hasattr(Document, order_by):
                        field = getattr(Document, order_by)
                        stmt = stmt.order_by(field.asc())
                        logger.info(f"应用升序排序: {order_by}")
                    else:
                        logger.warning(f"未知的排序字段: {order_by}")
            else:
                # 默认按创建时间降序排序
                stmt = stmt.order_by(Document.created_at.desc())
                logger.info("应用默认排序: created_at desc")
                
            stmt = stmt.offset(skip).limit(limit)
            logger.info(f"执行查询: {stmt}")
            
            rows = self.db.execute(stmt).scalars().all()
            logger.info(f"查询结果数量: {len(rows)}")
            
            # 修复：将SQLAlchemy模型转换为字典，然后创建Pydantic响应模型
            result = []
            for row in rows:
                try:
                    # 将SQLAlchemy模型转换为字典
                    doc_dict = {
                        "id": row.id,
                        "title": row.title,
                        "content": row.content,
                        "project_id": row.project_id,
                        "user_ids": row.specific_user_ids,  # 映射 specific_user_ids 到 user_ids
                        "author_id": row.author_id,
                        "created_at": row.created_at,
                        "updated_at": row.updated_at
                    }
                    doc_response = DocumentResponse(**doc_dict)
                    result.append(doc_response)
                except Exception as e:
                    logger.error(f"转换文档 {row.id} 时出错: {str(e)}")
                    continue
            
            logger.info("文档列表获取成功")
            return result
            
        except Exception as e:
            logger.error(f"获取文档列表时发生错误: {str(e)}", exc_info=True)
            raise

    async def get_document(self, document_id: int, user_id: int) -> DocumentWithComments:
        row = self.db.get(Document, document_id)
        if not row:
            raise ValueError("文档不存在")
        # TODO: 权限控制（项目成员检查）
        return DocumentWithComments.model_validate(row)

    async def update_document(self, document_id: int, payload: DocumentUpdate, user_id: int) -> DocumentResponse:
        row = self.db.get(Document, document_id)
        if not row:
            raise ValueError("文档不存在")
        # TODO: 权限控制（作者或项目管理员）
        
        if payload.title is not None:
            row.title = payload.title
        if payload.content is not None:
            row.content = payload.content
        if payload.project_id is not None:
            row.project_id = payload.project_id
        if payload.user_ids is not None:
            row.specific_user_ids = payload.user_ids
            
        self.db.commit()
        self.db.refresh(row)
        
        # 手动构建响应数据，确保字段匹配
        return DocumentResponse(
            id=row.id,
            title=row.title,
            content=row.content,
            project_id=row.project_id,
            user_ids=row.specific_user_ids,
            author_id=row.author_id,
            created_at=row.created_at,
            updated_at=row.updated_at
        )

    async def delete_document(self, document_id: int, user_id: int) -> bool:
        row = self.db.get(Document, document_id)
        if not row:
            raise ValueError("文档不存在")
        # TODO: 权限控制（作者或项目管理员）
        
        self.db.delete(row)
        self.db.commit()
        return True