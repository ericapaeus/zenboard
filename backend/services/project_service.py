from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from api.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectWithMembers
from models.project import Project
from models.project_membership import ProjectMembership
from models.user import User
import logging

logger = logging.getLogger(__name__)

class ProjectService:
    def __init__(self, db: Session):
        self.db = db

    async def create_project(self, project: ProjectCreate, creator_id: int) -> ProjectResponse:
        """创建项目"""
        try:
            # 创建项目记录
            db_project = Project(
                name=project.name,
                description=project.description,
                status="active",
                created_by=creator_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.db.add(db_project)
            self.db.flush()  # 获取项目ID
            
            # 添加创建者为项目成员
            if hasattr(db_project, 'id') and db_project.id:
                creator_member = ProjectMembership(
                    project_id=db_project.id,
                    user_id=creator_id,
                    role="owner",
                    joined_at=datetime.utcnow()
                )
                self.db.add(creator_member)
                
                # 添加其他成员
                if project.user_ids:
                    for user_id in project.user_ids:
                        if user_id != creator_id:  # 避免重复添加创建者
                            member = ProjectMembership(
                                project_id=db_project.id,
                                user_id=user_id,
                                role="member",
                                joined_at=datetime.utcnow()
                            )
                            self.db.add(member)
            
            self.db.commit()
            
            # 返回项目响应
            return ProjectResponse(
                id=str(db_project.id),
                name=db_project.name,
                description=db_project.description,
                status=db_project.status,
                created_by=str(db_project.created_by),
                created_at=db_project.created_at.isoformat(),
                updated_at=db_project.updated_at.isoformat()
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建项目失败: {str(e)}")
            raise e

    async def get_user_projects(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 20, 
        status_filter: Optional[str] = None
    ) -> List[ProjectResponse]:
        """获取用户参与的项目列表"""
        try:
            # 构建查询条件
            query = self.db.query(Project).join(
                ProjectMembership, Project.id == ProjectMembership.project_id
            ).filter(ProjectMembership.user_id == user_id)
            
            # 添加状态过滤
            if status_filter:
                query = query.filter(Project.status == status_filter)
            
            # 分页和排序 - 修复：order_by 应该在 offset 和 limit 之前
            projects = query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()
            
            # 转换为响应格式
            result = []
            for project in projects:
                # 获取项目成员信息
                members = self.db.query(ProjectMembership).filter(
                    ProjectMembership.project_id == project.id
                ).all()
                user_ids = [member.user_id for member in members]
                
                result.append(ProjectResponse(
                    id=str(project.id),
                    name=project.name,
                    description=project.description,
                    status=project.status,
                    created_by=str(project.created_by),
                    created_at=project.created_at.isoformat(),
                    updated_at=project.updated_at.isoformat(),
                    user_ids=user_ids,
                    member_count=len(user_ids)
                ))
            
            return result
            
        except Exception as e:
            logger.error(f"获取用户项目列表失败: {str(e)}")
            raise e

    async def get_project(self, project_id: int, user_id: int) -> ProjectWithMembers:
        """获取项目详情"""
        try:
            # 检查用户是否有权限访问项目
            project_member = self.db.query(ProjectMembership).filter(
                and_(
                    ProjectMembership.project_id == project_id,
                    ProjectMembership.user_id == user_id
                )
            ).first()
            
            if not project_member:
                raise ValueError("用户无权限访问该项目")
            
            # 获取项目信息
            project = self.db.query(Project).filter(Project.id == project_id).first()
            if not project:
                raise ValueError("项目不存在")
            
            # 获取项目成员
            members = self.db.query(ProjectMembership).filter(
                ProjectMembership.project_id == project_id
            ).all()
            
            user_ids = [member.user_id for member in members]
            
            return ProjectWithMembers(
                id=str(project.id),
                name=project.name,
                description=project.description,
                status=project.status,
                created_by=str(project.created_by),
                created_at=project.created_at.isoformat(),
                updated_at=project.updated_at.isoformat(),
                user_ids=user_ids,
                task_count=0,
                completed_task_count=0
            )
            
        except Exception as e:
            logger.error(f"获取项目详情失败: {str(e)}")
            raise e

    async def update_project(
        self, 
        project_id: int, 
        project_update: ProjectUpdate, 
        user_id: int
    ) -> ProjectResponse:
        """更新项目"""
        try:
            # 检查用户是否有权限更新项目
            project_member = self.db.query(ProjectMembership).filter(
                and_(
                    ProjectMembership.project_id == project_id,
                    ProjectMembership.user_id == user_id,
                    ProjectMembership.role.in_(["owner", "admin"])
                )
            ).first()
            
            if not project_member:
                raise ValueError("用户无权限更新该项目")
            
            # 获取项目
            project = self.db.query(Project).filter(Project.id == project_id).first()
            if not project:
                raise ValueError("项目不存在")
            
            # 更新项目信息
            if project_update.name is not None:
                project.name = project_update.name
            if project_update.description is not None:
                project.description = project_update.description
            if project_update.status is not None:
                project.status = project_update.status
            
            project.updated_at = datetime.utcnow()
            
            # 更新项目成员
            if project_update.user_ids is not None:
                # 删除现有成员（除了创建者）
                self.db.query(ProjectMembership).filter(
                    and_(
                        ProjectMembership.project_id == project_id,
                        ProjectMembership.role != "owner"
                    )
                ).delete()
                
                # 添加新成员
                for user_id in project_update.user_ids:
                    if user_id != project.created_by:  # 不重复添加创建者
                        member = ProjectMembership(
                            project_id=project_id,
                            user_id=user_id,
                            role="member",
                            joined_at=datetime.utcnow()
                        )
                        self.db.add(member)
            
            self.db.commit()
            
            return ProjectResponse(
                id=str(project.id),
                name=project.name,
                description=project.description,
                status=project.status,
                created_by=str(project.created_by),
                created_at=project.created_at.isoformat(),
                updated_at=project.updated_at.isoformat()
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新项目失败: {str(e)}")
            raise e

    async def delete_project(self, project_id: int, user_id: int):
        """删除项目"""
        try:
            # 检查用户是否有权限删除项目
            project_member = self.db.query(ProjectMembership).filter(
                and_(
                    ProjectMembership.project_id == project_id,
                    ProjectMembership.user_id == user_id,
                    ProjectMembership.role == "owner"
                )
            ).first()
            
            if not project_member:
                raise ValueError("只有项目创建者可以删除项目")
            
            # 删除项目成员
            self.db.query(ProjectMembership).filter(
                ProjectMembership.project_id == project_id
            ).delete()
            
            # 删除项目
            self.db.query(Project).filter(Project.id == project_id).delete()
            
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除项目失败: {str(e)}")
            raise e