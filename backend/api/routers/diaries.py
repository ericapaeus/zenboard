from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.database import get_db
from api.schemas.response import ApiResponse
from api.schemas.diary import DiaryCreate, DiaryUpdate, DiaryResponse, DiaryWithComments
from services.diary_service import DiaryService
from models.user import User
from api.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=ApiResponse[DiaryResponse], summary="创建日记")
async def create_diary(
    diary: DiaryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    创建新日记
    """
    try:
        diary_service = DiaryService(db)
        new_diary = await diary_service.create_diary(diary, current_user.id)
        return ApiResponse(
            code=201,
            message="日记创建成功",
            data=new_diary,
            success=True
        )
    except Exception as e:
        logger.error(f"创建日记失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="创建日记失败"
        )

@router.get("/", response_model=ApiResponse[List[DiaryResponse]], summary="获取日记列表")
async def get_diaries(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回记录数"),
    author_id: Optional[int] = Query(None, description="作者ID过滤"),
    visibility: Optional[str] = Query(None, description="可见性过滤"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    获取日记列表
    """
    try:
        diary_service = DiaryService(db)
        diaries = await diary_service.get_diaries(
            current_user.id, skip, limit, author_id, visibility
        )
        return ApiResponse(
            code=200,
            message="获取日记列表成功",
            data=diaries,
            success=True
        )
    except Exception as e:
        logger.error(f"获取日记列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取日记列表失败"
        )

@router.get("/{diary_id}", response_model=ApiResponse[DiaryWithComments], summary="获取日记详情")
async def get_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    获取日记详情
    """
    try:
        diary_service = DiaryService(db)
        diary = await diary_service.get_diary(diary_id, current_user.id)
        return ApiResponse(
            code=200,
            message="获取日记详情成功",
            data=diary,
            success=True
        )
    except Exception as e:
        logger.error(f"获取日记详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日记不存在或无权限访问"
        )

@router.put("/{diary_id}", response_model=ApiResponse[DiaryResponse], summary="更新日记")
async def update_diary(
    diary_id: int,
    diary_update: DiaryUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    更新日记信息
    """
    try:
        diary_service = DiaryService(db)
        updated_diary = await diary_service.update_diary(diary_id, diary_update, current_user.id)
        return ApiResponse(
            code=200,
            message="日记更新成功",
            data=updated_diary,
            success=True
        )
    except Exception as e:
        logger.error(f"更新日记失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新日记失败"
        )

@router.delete("/{diary_id}", response_model=ApiResponse, summary="删除日记")
async def delete_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    删除日记
    """
    try:
        diary_service = DiaryService(db)
        await diary_service.delete_diary(diary_id, current_user.id)
        return ApiResponse(
            code=200,
            message="日记删除成功",
            data=None,
            success=True
        )
    except Exception as e:
        logger.error(f"删除日记失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="删除日记失败"
        ) 