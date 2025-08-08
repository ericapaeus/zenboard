from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    nickname: str = Field(..., description="昵称")

class UserCreate(UserBase):
    password: str = Field(..., description="密码", min_length=6)

class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, description="昵称")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    avatar: Optional[str] = Field(None, description="头像URL")
    hire_date: Optional[datetime] = Field(None, description="入职日期")
    contract_expiry: Optional[datetime] = Field(None, description="合同到期日")

class UserResponse(BaseModel):
    id: int
    username: Optional[str] = ""
    email: Optional[EmailStr] = None
    nickname: str
    status: str
    avatar: Optional[str] = None
    hire_date: Optional[datetime] = None
    contract_expiry: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class QRCodeResponse(BaseModel):
    qr_code_url: str
    expires_at: datetime
    session_id: str 