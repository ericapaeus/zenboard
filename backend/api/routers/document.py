from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.database import get_db
from api.schemas.response import ApiResponse
from api.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse, DocumentWithComments
from services.document_service import DocumentService
from api.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("", response_model=ApiResponse[DocumentResponse], summary="创建文档")
async def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        svc = DocumentService(db)
        new_doc = await svc.create_document(document, current_user.id)
        return ApiResponse(code=201, message="文档创建成功", data=new_doc, success=True)
    except Exception as e:
        logger.error(f"创建文档失败: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="创建文档失败")

@router.get("", response_model=ApiResponse[List[DocumentResponse]], summary="获取文档列表")
async def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    author_id: Optional[int] = Query(None),
    visibility: Optional[str] = Query(None),
    order_by: Optional[str] = Query(None, description="排序字段，支持-id表示降序，id表示升序"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        svc = DocumentService(db)
        docs = await svc.get_documents(current_user.id, skip, limit, author_id, None, order_by)
        return ApiResponse(code=200, message="获取文档列表成功", data=docs, success=True)
    except Exception as e:
        logger.error(f"获取文档列表失败: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="获取文档列表失败")

@router.get("/{document_id}", response_model=ApiResponse[DocumentWithComments], summary="获取文档详情")
async def get_document(document_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        svc = DocumentService(db)
        doc = await svc.get_document(document_id, current_user.id)
        return ApiResponse(code=200, message="获取文档详情成功", data=doc, success=True)
    except Exception as e:
        logger.error(f"获取文档详情失败: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文档不存在或无权限访问")

@router.put("/{document_id}", response_model=ApiResponse[DocumentResponse], summary="更新文档")
async def update_document(document_id: int, document_update: DocumentUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        svc = DocumentService(db)
        updated = await svc.update_document(document_id, document_update, current_user.id)
        return ApiResponse(code=200, message="文档更新成功", data=updated, success=True)
    except Exception as e:
        logger.error(f"更新文档失败: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="更新文档失败")

@router.delete("/{document_id}", response_model=ApiResponse, summary="删除文档")
async def delete_document(document_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        svc = DocumentService(db)
        await svc.delete_document(document_id, current_user.id)
        return ApiResponse(code=200, message="文档删除成功", data=None, success=True)
    except Exception as e:
        logger.error(f"删除文档失败: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="删除文档失败") 