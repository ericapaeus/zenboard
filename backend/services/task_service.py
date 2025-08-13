from typing import List, Optional
from sqlalchemy.orm import Session
from api.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskWithSubtasks, TaskStatus as ApiTaskStatus, TaskPriority as ApiTaskPriority, TaskVisibility
from models.task import Task, TaskStatus as ModelTaskStatus, TaskPriority as ModelTaskPriority
from sqlalchemy.exc import NoResultFound
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def _to_task_response(self, db_task: Task) -> TaskResponse:
        # 状态映射: pending->todo, completed->done
        if db_task.status == ModelTaskStatus.COMPLETED:
            status = ApiTaskStatus.DONE.value
        else:
            status = ApiTaskStatus.TODO.value
        # 优先级映射
        if db_task.priority == ModelTaskPriority.LOW:
            priority = ApiTaskPriority.LOW.value
        elif db_task.priority == ModelTaskPriority.HIGH:
            priority = ApiTaskPriority.HIGH.value
        else:
            priority = ApiTaskPriority.MEDIUM.value
        # 可见性默认按项目
        visibility = TaskVisibility.PROJECT.value
        # 估算工时暂不使用
        estimated_hours = None
        # 组装响应
        return TaskResponse(
            id=db_task.id,
            title=db_task.title,
            description=db_task.content or "",
            status=status,
            visibility=visibility,
            priority=priority,
            estimated_hours=estimated_hours,
            due_date=db_task.due_date,
            project_id=db_task.project_id,
            parent_task_id=db_task.parent_task_id,
            creator_id=db_task.creator_id,
            assignee_id=db_task.assignee_id,
            created_at=db_task.created_at,
            updated_at=db_task.updated_at,
            completed_at=db_task.completed_at,
        )

    async def create_task(self, task: TaskCreate, creator_id: int) -> TaskResponse:
        """创建任务"""
        db_task = Task(
            title=task.title,
            content=task.description,
            status=ModelTaskStatus.PENDING,
            priority=ModelTaskPriority.MEDIUM,
            project_id=task.project_id,
            parent_task_id=task.parent_task_id,
            creator_id=creator_id,
            assignee_id=task.assignee_id,
            original_assignee_id=task.assignee_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            due_date=task.due_date,
        )
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return self._to_task_response(db_task)

    async def get_tasks(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        project_id: Optional[int] = None,
        status_filter: Optional[str] = None,
        assignee_id: Optional[int] = None
    ) -> List[TaskResponse]:
        """获取任务列表"""
        query = self.db.query(Task)
        if project_id is not None:
            query = query.filter(Task.project_id == project_id)
        if status_filter:
            # 兼容传入 todo/in_progress/completed/done
            if status_filter in ("done", "completed"):
                query = query.filter(Task.status == ModelTaskStatus.COMPLETED)
            else:
                query = query.filter(Task.status == ModelTaskStatus.PENDING)
        if assignee_id is not None:
            query = query.filter(Task.assignee_id == assignee_id)
        tasks = query.offset(skip).limit(limit).all()
        return [self._to_task_response(t) for t in tasks]

    async def get_task(self, task_id: int, user_id: int) -> TaskWithSubtasks:
        """获取任务详情"""
        db_task = self.db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            raise NoResultFound(f"Task {task_id} not found")
        # 获取子任务
        subtasks = self.db.query(Task).filter(Task.parent_task_id == task_id).all()
        task_resp = TaskWithSubtasks(**self._to_task_response(db_task).model_dump())
        task_resp.subtasks = [self._to_task_response(st) for st in subtasks]
        return task_resp

    async def update_task(
        self,
        task_id: int,
        task_update: TaskUpdate,
        user_id: int
    ) -> TaskResponse:
        """更新任务"""
        db_task = self.db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            raise NoResultFound(f"Task {task_id} not found")
        # 权限校验（可根据需求调整）
        if db_task.creator_id != user_id and db_task.assignee_id != user_id:
            raise PermissionError("无权限操作该任务")
        # 字段映射与更新
        payload = task_update.model_dump(exclude_unset=True)
        if "title" in payload:
            db_task.title = payload["title"]
        if "description" in payload:
            db_task.content = payload["description"]
        if "assignee_id" in payload:
            db_task.assignee_id = payload["assignee_id"]
        if "project_id" in payload:
            db_task.project_id = payload["project_id"]
        if "parent_task_id" in payload:
            db_task.parent_task_id = payload["parent_task_id"]
        if "due_date" in payload:
            db_task.due_date = payload["due_date"]
        if "status" in payload:
            db_task.status = ModelTaskStatus.COMPLETED if str(payload["status"]) in ("done", "completed") else ModelTaskStatus.PENDING
        if "priority" in payload:
            pr = str(payload["priority"]).lower()
            if pr == "low":
                db_task.priority = ModelTaskPriority.LOW
            elif pr == "high":
                db_task.priority = ModelTaskPriority.HIGH
            else:
                db_task.priority = ModelTaskPriority.MEDIUM
        db_task.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_task)
        return self._to_task_response(db_task)

    async def delete_task(self, task_id: int, user_id: int):
        """删除任务"""
        db_task = self.db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            raise NoResultFound(f"Task {task_id} not found")
        if db_task.creator_id != user_id:
            raise PermissionError("只有创建者可以删除任务")
        self.db.delete(db_task)
        self.db.commit() 