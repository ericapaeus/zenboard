from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timezone, timedelta
from enum import Enum

# 定义北京时间时区
BEIJING_TIMEZONE = timezone(timedelta(hours=8))

def convert_to_beijing_time(dt: datetime) -> datetime:
    """将datetime对象转换为北京时间"""
    if dt is None:
        return dt
    
    # 如果没有时区信息，假设为UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    # 转换为北京时间
    return dt.astimezone(BEIJING_TIMEZONE)

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
        json_encoders = {
            datetime: lambda v: convert_to_beijing_time(v).strftime("%Y-%m-%d %H:%M:%S")
        }

    @field_validator('created_at', 'updated_at', 'hire_date', 'contract_expiry', mode='before')
    @classmethod
    def convert_datetime_fields(cls, v):
        """转换时间字段为北京时间"""
        if isinstance(v, datetime):
            return convert_to_beijing_time(v)
        return v