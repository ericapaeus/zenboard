from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserStatus(str, Enum):
    PENDING = "未审核"
    PENDING_REVIEW = "待审核"
    ACTIVE = "已通过"
    INACTIVE = "已拒绝"

class UserRole(str, Enum):
    USER = "普通用户"
    ADMIN = "管理员"

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="邮箱")
    name: Optional[str] = Field(None, description="姓名")
    phone: Optional[str] = Field(None, description="手机号")
    role: Optional[UserRole] = Field(UserRole.USER, description="角色")

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="邮箱")
    name: Optional[str] = Field(None, description="姓名")
    phone: Optional[str] = Field(None, description="手机号")
    role: Optional[UserRole] = Field(None, description="角色")
    avatar: Optional[str] = Field(None, description="头像URL")
    hire_date: Optional[datetime] = Field(None, description="入职日期")
    contract_expiry: Optional[datetime] = Field(None, description="合同到期日")
    status: Optional[UserStatus] = Field(None, description="用户状态")

class UserResponse(BaseModel):
    id: int
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    status: str
    avatar: Optional[str] = None
    hire_date: Optional[datetime] = None
    contract_expiry: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True