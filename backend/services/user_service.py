from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from models.user import User
from api.schemas.user import UserUpdate, UserResponse, UserStatus
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, db: Session):
        self.db = db

    async def get_users(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        status_filter: Optional[str] = None
    ) -> List[UserResponse]:
        """获取用户列表"""
        query = self.db.query(User)
        
        if status_filter:
            query = query.filter(User.status == status_filter)
        
        users = query.offset(skip).limit(limit).all()
        
        # 转换为响应模型
        return [
            UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                phone=user.phone,
                role=user.role,
                status=user.status,
                avatar=user.avatar,
                hire_date=user.hire_date,
                contract_expiry=user.contract_expiry,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            for user in users
        ]

    async def update_user(self, user_id: int, user_update: UserUpdate) -> UserResponse:
        """
        更新用户信息
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")
        
        # 更新字段
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            phone=user.phone,
            role=user.role,
            status=user.status,
            avatar=user.avatar,
            hire_date=user.hire_date,
            contract_expiry=user.contract_expiry,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    async def approve_user(self, user_id: int) -> UserResponse:
        """审批用户"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")
        
        if user.status != UserStatus.PENDING:
            raise ValueError("用户状态不是未审核")
        
        user.status = UserStatus.ACTIVE
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            phone=user.phone,
            role=user.role,
            status=user.status,
            avatar=user.avatar,
            hire_date=user.hire_date,
            contract_expiry=user.contract_expiry,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    async def get_contract_reminders(self, days: int = 30) -> List[UserResponse]:
        """获取合同到期提醒"""
        expiry_date = datetime.utcnow() + timedelta(days=days)
        
        users = self.db.query(User).filter(
            User.contract_expiry <= expiry_date,
            User.contract_expiry >= datetime.utcnow(),
            User.status == UserStatus.ACTIVE
        ).all()
        
        return [
            UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                phone=user.phone,
                role=user.role,
                status=user.status,
                avatar=user.avatar,
                hire_date=user.hire_date,
                contract_expiry=user.contract_expiry,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            for user in users
        ] 