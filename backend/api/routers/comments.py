from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.database import get_db
from api.schemas.response import ApiResponse
from api.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from services.comment_service import CommentService
from models.user import User
from api.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=ApiResponse[CommentResponse], summary="创建评论")
async def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    创建新评论
    """
    try:
        comment_service = CommentService(db)
        new_comment = await comment_service.create_comment(comment, current_user.id)
        return ApiResponse(
            code=201,
            message="评论创建成功",
            data=new_comment,
            success=True
        )
    except Exception as e:
        logger.error(f"创建评论失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="创建评论失败"
        )

@router.get("/", response_model=ApiResponse[List[CommentResponse]], summary="获取评论列表")
async def get_comments(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回记录数"),
    task_id: Optional[int] = Query(None, description="任务ID过滤"),
    diary_entry_id: Optional[int] = Query(None, description="日记ID过滤"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    获取评论列表
    """
    try:
        comment_service = CommentService(db)
        comments = await comment_service.get_comments(
            current_user.id, skip, limit, task_id, diary_entry_id
        )
        return ApiResponse(
            code=200,
            message="获取评论列表成功",
            data=comments,
            success=True
        )
    except Exception as e:
        logger.error(f"获取评论列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取评论列表失败"
        )

@router.get("/{comment_id}", response_model=ApiResponse[CommentResponse], summary="获取评论详情")
async def get_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    获取评论详情
    """
    try:
        comment_service = CommentService(db)
        comment = await comment_service.get_comment(comment_id, current_user.id)
        return ApiResponse(
            code=200,
            message="获取评论详情成功",
            data=comment,
            success=True
        )
    except Exception as e:
        logger.error(f"获取评论详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评论不存在或无权限访问"
        )

@router.put("/{comment_id}", response_model=ApiResponse[CommentResponse], summary="更新评论")
async def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    更新评论信息
    """
    try:
        comment_service = CommentService(db)
        updated_comment = await comment_service.update_comment(comment_id, comment_update, current_user.id)
        return ApiResponse(
            code=200,
            message="评论更新成功",
            data=updated_comment,
            success=True
        )
    except Exception as e:
        logger.error(f"更新评论失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新评论失败"
        )

@router.delete("/{comment_id}", response_model=ApiResponse, summary="删除评论")
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    删除评论
    """
    try:
        comment_service = CommentService(db)
        await comment_service.delete_comment(comment_id, current_user.id)
        return ApiResponse(
            code=200,
            message="评论删除成功",
            data=None,
            success=True
        )
    except Exception as e:
        logger.error(f"删除评论失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="删除评论失败"
        ) 