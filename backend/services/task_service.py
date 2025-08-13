from typing import List, Optional
from sqlalchemy.orm import Session
from api.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskWithSubtasks
from models.task import Task, TaskPriority as ModelTaskPriority
from sqlalchemy.exc import NoResultFound
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def _map_priority(self, priority: str) -> ModelTaskPriority:
        """映射前端优先级到后端枚举值"""
        if priority:
            pr = str(priority).lower()
            if pr == "low":
                return ModelTaskPriority.LOW
            elif pr == "high":
                return ModelTaskPriority.HIGH
            else:
                return ModelTaskPriority.MEDIUM
        return ModelTaskPriority.MEDIUM

    def _to_task_response(self, db_task: Task) -> TaskResponse:
        # 处理子任务数据
        subtasks = []
        if db_task.subtasks:
            for subtask in db_task.subtasks:
                if isinstance(subtask, dict):
                    # 兼容现有的数据结构，支持assignee和assignee_id
                    assignee_id = subtask.get('assignee_id')
                    assignee = subtask.get('assignee')
                    
                    # 如果没有assignee_id但有assignee，尝试通过用户名查找用户ID
                    if not assignee_id and assignee:
                        # 这里可以添加通过用户名查找用户ID的逻辑
                        # 暂时保持兼容性
                        pass
                    
                    subtasks.append({
                        'id': subtask.get('id', ''),
                        'title': subtask.get('title', ''),
                        'content': subtask.get('content', ''),
                        'assignee_id': assignee_id,
                        'assignee': assignee,  # 保持向后兼容
                        'created_at': subtask.get('created_at', '')
                    })
        
        # 组装响应
        return TaskResponse(
            id=db_task.id,
            title=db_task.title,
            content=db_task.content or "",
            priority=db_task.priority.value,
            start_date=db_task.start_date,
            end_date=db_task.end_date,
            project_id=db_task.project_id,
            creator_id=db_task.creator_id,
            assignee_id=db_task.assignee_id,
            created_at=db_task.created_at,
            updated_at=db_task.updated_at,
            subtasks=subtasks,  # 添加子任务数据
        )

    def _can_user_access_task(self, task: Task, user_id: int) -> bool:
        """检查用户是否有权限访问任务"""
        # 任务创建人
        if task.creator_id == user_id:
            return True
        
        # 任务责任人
        if task.assignee_id == user_id:
            return True
        
        # 子任务处理人 - 检查子任务的assignee_id
        if task.subtasks:
            for subtask in task.subtasks:
                if isinstance(subtask, dict) and subtask.get('assignee_id') == user_id:
                    return True
        
        return False

    async def create_task(self, task: TaskCreate, creator_id: int) -> TaskResponse:
        """创建任务"""
        # 处理子任务数据
        subtasks_data = None
        if hasattr(task, 'subtasks') and task.subtasks:
            subtasks_data = []
            for subtask in task.subtasks:
                if hasattr(subtask, 'title') and subtask.title:
                    subtasks_data.append({
                        'id': f"s{len(subtasks_data) + 1}",
                        'title': subtask.title,
                        'content': getattr(subtask, 'content', ''),
                        'assignee_id': getattr(subtask, 'assignee_id', None),  # 保存 user_id
                        'created_at': datetime.utcnow().isoformat()
                    })
        
        db_task = Task(
            title=task.title,
            content=task.content,  # 使用content字段
            priority=self._map_priority(task.priority),
            project_id=task.project_id,
            creator_id=creator_id,
            assignee_id=task.assignee_id,
            subtasks=subtasks_data,  # 保存子任务JSON数据
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            start_date=task.start_date,  # 添加开始时间
            end_date=task.end_date,      # 添加结束时间
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
        # 先获取基本的任务列表
        query = self.db.query(Task)
        if project_id is not None:
            query = query.filter(Task.project_id == project_id)
        
        # 基础权限过滤：用户只能看到自己创建的任务、分配给自己的任务
        query = query.filter(
            (Task.creator_id == user_id) |  # 自己创建的任务
            (Task.assignee_id == user_id)   # 分配给自己的任务
        )
        
        if assignee_id is not None:
            query = query.filter(Task.assignee_id == assignee_id)
        
        # 获取基础任务列表
        base_tasks = query.offset(skip).limit(limit).all()
        
        # 在Python层面检查子任务权限
        accessible_tasks = []
        for task in base_tasks:
            # 如果用户有基础权限，直接添加
            if task.creator_id == user_id or task.assignee_id == user_id:
                accessible_tasks.append(task)
            # 否则检查子任务权限
            elif task.subtasks:
                for subtask in task.subtasks:
                    if isinstance(subtask, dict) and subtask.get('assignee_id') == user_id:
                        accessible_tasks.append(task)
                        break
        
        return [self._to_task_response(t) for t in accessible_tasks]

    async def get_task(self, task_id: int, user_id: int) -> TaskWithSubtasks:
        """获取任务详情"""
        db_task = self.db.query(Task).filter(Task.id == task_id).first()
        if not db_task:
            raise NoResultFound(f"Task {task_id} not found")
        
        # 权限检查：用户是否有权限查看这个任务
        if not self._can_user_access_task(db_task, user_id):
            raise PermissionError("无权限查看该任务")
        
        # 获取子任务 - 从JSON字段中读取
        subtasks = []
        if db_task.subtasks:
            subtasks = db_task.subtasks
        
        task_resp = TaskWithSubtasks(**self._to_task_response(db_task).model_dump())
        task_resp.subtasks = subtasks
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
        
        # 添加调试日志
        logger.info(f"更新任务 {task_id}，接收到的数据: {payload}")
        
        if "title" in payload:
            db_task.title = payload["title"]
        if "content" in payload:
            db_task.content = payload["content"]
        if "assignee_id" in payload:
            db_task.assignee_id = payload["assignee_id"]
        if "project_id" in payload:
            db_task.project_id = payload["project_id"]
        else:
            # 如果没有传递 project_id，说明用户想要清空项目
            logger.info("没有接收到 project_id，清空数据库中的 project_id 字段")
            db_task.project_id = None
        if "start_date" in payload:
            db_task.start_date = payload["start_date"]
        if "end_date" in payload:
            db_task.end_date = payload["end_date"]
        if "priority" in payload:
            pr = str(payload["priority"]).lower()
            if pr == "low":
                db_task.priority = ModelTaskPriority.LOW
            elif pr == "high":
                db_task.priority = ModelTaskPriority.HIGH
            else:
                db_task.priority = ModelTaskPriority.MEDIUM
        # 处理子任务更新
        if "subtasks" in payload:
            logger.info(f"处理子任务更新，原始子任务: {db_task.subtasks}")
            logger.info(f"新的子任务数据: {payload['subtasks']}")
            
            subtasks_data = []
            if payload["subtasks"]:
                for subtask in payload["subtasks"]:
                    logger.info(f"处理子任务: {subtask}, 类型: {type(subtask)}")
                    # 处理字典格式的子任务数据
                    if isinstance(subtask, dict):
                        title = subtask.get('title', '')
                        logger.info(f"字典格式子任务，标题: {title}")
                        if title:  # 检查标题是否存在且不为空
                            # 如果是新子任务，生成ID
                            subtask_id = subtask.get('id', '')
                            if not subtask_id or subtask_id.startswith('temp_'):
                                subtask_id = f"s{len(subtasks_data) + 1}"
                            
                            subtask_data = {
                                'id': subtask_id,
                                'title': title,
                                'content': subtask.get('content', ''),
                                'assignee_id': subtask.get('assignee_id'),
                                'created_at': subtask.get('created_at', datetime.utcnow().isoformat())
                            }
                            subtasks_data.append(subtask_data)
                            logger.info(f"添加子任务数据: {subtask_data}")
                    # 处理对象格式的子任务数据（向后兼容）
                    elif hasattr(subtask, 'title') and subtask.title:
                        # 如果是新子任务，生成ID
                        subtask_id = getattr(subtask, 'id', None)
                        if not subtask_id or subtask_id.startswith('temp_'):
                            subtask_id = f"s{len(subtasks_data) + 1}"
                        
                        subtasks_data.append({
                            'id': subtask_id,
                            'title': subtask.title,
                            'content': getattr(subtask, 'content', ''),
                            'assignee_id': getattr(subtask, 'assignee_id', None),
                            'created_at': getattr(subtask, 'created_at', datetime.utcnow().isoformat())
                        })
            
            logger.info(f"处理后的子任务数据: {subtasks_data}")
            logger.info(f"设置前的 db_task.subtasks: {db_task.subtasks}")
            db_task.subtasks = subtasks_data
            logger.info(f"设置后的 db_task.subtasks: {db_task.subtasks}")
        else:
            logger.info("没有接收到子任务数据")
        
        db_task.updated_at = datetime.utcnow()
        logger.info(f"提交前的完整任务数据: {db_task.subtasks}")
        self.db.commit()
        logger.info(f"数据库提交完成")
        self.db.refresh(db_task)
        logger.info(f"刷新后的任务数据: {db_task.subtasks}")
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