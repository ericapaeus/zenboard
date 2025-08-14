from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.database import get_db
from api.schemas.response import ApiResponse
from api.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectWithMembers
from services.project_service import ProjectService
from models.user import User
from api.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("", response_model=ApiResponse[ProjectResponse], summary="创建项目")
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建新项目
    """
    try:
        project_service = ProjectService(db)
        new_project = await project_service.create_project(project, current_user.id)
        return ApiResponse(
            code=201,
            message="项目创建成功",
            data=new_project,
            success=True
        )
    except Exception as e:
        logger.error(f"创建项目失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="创建项目失败"
        )

@router.get("", response_model=ApiResponse[List[ProjectResponse]], summary="获取用户项目列表")
async def get_user_projects(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="返回记录数"),
    status_filter: Optional[str] = Query(None, description="项目状态过滤"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取当前用户参与的项目列表
    """
    try:
        project_service = ProjectService(db)
        projects = await project_service.get_user_projects(
            current_user.id, skip, limit, status_filter
        )
        return ApiResponse(
            code=200,
            message="获取项目列表成功",
            data=projects,
            success=True
        )
    except Exception as e:
        logger.error(f"获取项目列表失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取项目列表失败"
        )

@router.get("/{project_id}", response_model=ApiResponse[ProjectWithMembers], summary="获取项目详情")
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取项目详情
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.get_project(project_id, current_user.id)
        return ApiResponse(
            code=200,
            message="获取项目详情成功",
            data=project,
            success=True
        )
    except Exception as e:
        logger.error(f"获取项目详情失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="项目不存在或无权限访问"
        )

@router.put("/{project_id}", response_model=ApiResponse[ProjectResponse], summary="更新项目")
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新项目信息
    """
    try:
        project_service = ProjectService(db)
        updated_project = await project_service.update_project(
            project_id, project_update, current_user.id
        )
        return ApiResponse(
            code=200,
            message="项目更新成功",
            data=updated_project,
            success=True
        )
    except Exception as e:
        logger.error(f"更新项目失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新项目失败"
        )

@router.delete("/{project_id}", response_model=ApiResponse[dict], summary="删除项目")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除项目
    """
    try:
        project_service = ProjectService(db)
        await project_service.delete_project(project_id, current_user.id)
        return ApiResponse(
            code=200,
            message="项目删除成功",
            data={"project_id": project_id, "deleted": True},
            success=True
        )
    except Exception as e:
        logger.error(f"删除项目失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="删除项目失败"
        )

@router.post("/{project_id}/archive", response_model=ApiResponse[ProjectResponse], summary="归档项目")
async def archive_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    归档项目
    """
    try:
        project_service = ProjectService(db)
        project_update = ProjectUpdate(status="archived")
        archived_project = await project_service.update_project(
            project_id, project_update, current_user.id
        )
        return ApiResponse(
            code=200,
            message="项目归档成功",
            data=archived_project,
            success=True
        )
    except Exception as e:
        logger.error(f"归档项目失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="归档项目失败"
        )

@router.post("/{project_id}/activate", response_model=ApiResponse[ProjectResponse], summary="激活项目")
async def activate_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    激活已归档的项目
    """
    try:
        project_service = ProjectService(db)
        project_update = ProjectUpdate(status="active")
        activated_project = await project_service.update_project(
            project_id, project_update, current_user.id
        )
        return ApiResponse(
            code=200,
            message="项目激活成功",
            data=activated_project,
            success=True
        )
    except Exception as e:
        logger.error(f"激活项目失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="激活项目失败"
        ) 