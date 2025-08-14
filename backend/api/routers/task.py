from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.database import get_db
from api.schemas.response import ApiResponse
from api.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskWithSubtasks
from api.schemas.comment import CommentResponse
from services.task_service import TaskService
from services.comment_service import CommentService
from models.user import User
from api.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("", response_model=ApiResponse[TaskResponse], summary="创建任务")
async def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    创建新任务
    """
    try:
        task_service = TaskService(db)
        new_task = await task_service.create_task(task, current_user.id)
        return ApiResponse(
            code=201,
            message="任务创建成功",
            data=new_task,
            success=True
        )
    except Exception as e:
        logger.error(f"创建任务失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="创建任务失败"
        )

@router.get("", response_model=ApiResponse[List[TaskResponse]], summary="获取任务列表")
async def get_tasks(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回记录数"),
    project_id: Optional[int] = Query(None, description="项目ID过滤"),
    status_filter: Optional[str] = Query(None, description="任务状态过滤"),
    assignee_id: Optional[int] = Query(None, description="指派用户过滤"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    获取任务列表
    """
    try:
        task_service = TaskService(db)
        tasks = await task_service.get_tasks(
            current_user.id, skip, limit, project_id, status_filter, assignee_id
        )
        return ApiResponse(
            code=200,
            message="获取任务列表成功",
            data=tasks,
            success=True
        )
    except Exception as e:
        logger.error(f"获取任务列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取任务列表失败"
        )

@router.get("/{task_id}", response_model=ApiResponse[TaskWithSubtasks], summary="获取任务详情")
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    获取任务详情
    """
    try:
        task_service = TaskService(db)
        task = await task_service.get_task(task_id, current_user.id)
        return ApiResponse(
            code=200,
            message="获取任务详情成功",
            data=task,
            success=True
        )
    except Exception as e:
        logger.error(f"获取任务详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在或无权限访问"
        )

@router.put("/{task_id}", response_model=ApiResponse[TaskResponse], summary="更新任务")
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    更新任务信息
    """
    try:
        task_service = TaskService(db)
        updated_task = await task_service.update_task(task_id, task_update, current_user.id)
        return ApiResponse(
            code=200,
            message="任务更新成功",
            data=updated_task,
            success=True
        )
    except Exception as e:
        logger.error(f"更新任务失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新任务失败"
        )

@router.delete("/{task_id}", response_model=ApiResponse, summary="删除任务")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    删除任务
    """
    try:
        task_service = TaskService(db)
        await task_service.delete_task(task_id, current_user.id)
        return ApiResponse(
            code=200,
            message="任务删除成功",
            data=None,
            success=True
        )
    except Exception as e:
        logger.error(f"删除任务失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="删除任务失败"
        )

@router.get("/{task_id}/comments", response_model=ApiResponse[List[CommentResponse]], summary="获取任务评论")
async def get_task_comments(
    task_id: int,
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回记录数"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    获取指定任务的评论列表
    """
    try:
        comment_service = CommentService(db)
        comments = await comment_service.get_comments(
            current_user.id, skip, limit, task_id=task_id
        )
        return ApiResponse(
            code=200,
            message="获取任务评论成功",
            data=comments,
            success=True
        )
    except Exception as e:
        logger.error(f"获取任务评论失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取任务评论失败"
        ) 