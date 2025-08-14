from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from api.schemas.response import ApiResponse
from api.schemas.document_comment import DocumentCommentCreate, DocumentCommentResponse
from services.document_comment_service import DocumentCommentService
from api.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("", response_model=ApiResponse[DocumentCommentResponse], summary="新增文档评论")
async def add_comment(payload: DocumentCommentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        svc = DocumentCommentService(db)
        created = await svc.add_comment(payload, current_user.id)
        return ApiResponse(code=201, message="评论创建成功", data=created, success=True)
    except Exception as e:
        logger.error(f"创建评论失败: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="创建评论失败")

@router.get("/by-document/{document_id}", response_model=ApiResponse[List[DocumentCommentResponse]], summary="获取文档评论列表")
async def list_comments(document_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        svc = DocumentCommentService(db)
        rows = await svc.list_by_document(document_id)
        return ApiResponse(code=200, message="获取评论成功", data=rows, success=True)
    except Exception as e:
        logger.error(f"获取评论失败: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="获取评论失败")

@router.delete("/{comment_id}", response_model=ApiResponse, summary="删除文档评论")
async def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        svc = DocumentCommentService(db)
        await svc.delete_comment(comment_id, current_user.id)
        return ApiResponse(code=200, message="删除评论成功", data=None, success=True)
    except Exception as e:
        logger.error(f"删除评论失败: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="删除评论失败") 