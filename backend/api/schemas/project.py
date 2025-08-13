from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: str
    user_ids: Optional[List[int]] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    user_ids: Optional[List[int]] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_by: str
    created_at: str
    updated_at: str
    user_ids: List[int] = []  # 添加成员ID列表
    member_count: int = 0      # 添加成员数量

class ProjectWithMembers(ProjectResponse):
    user_ids: List[int]
    task_count: int = 0
    completed_task_count: int = 0 