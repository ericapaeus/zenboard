from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    name: str = Field(..., description="项目名称", max_length=100)
    description: Optional[str] = Field(None, description="项目描述")

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, description="项目名称", max_length=100)
    description: Optional[str] = Field(None, description="项目描述")
    status: Optional[str] = Field(None, description="项目状态")

class ProjectResponse(ProjectBase):
    id: int
    status: str
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectMembershipBase(BaseModel):
    role: str = Field("member", description="成员角色")

class ProjectMembershipCreate(ProjectMembershipBase):
    user_id: int = Field(..., description="用户ID")

class ProjectMembershipResponse(ProjectMembershipBase):
    id: int
    project_id: int
    user_id: int
    joined_at: datetime
    user: "UserResponse"

    class Config:
        from_attributes = True

class ProjectWithMembers(ProjectResponse):
    members: List[ProjectMembershipResponse] = [] 