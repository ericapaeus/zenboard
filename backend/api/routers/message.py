from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from api.schemas.response import ApiResponse
from api.schemas.message import MessageCreate, MessageResponse, UserNotificationResponse
from services.message_service import MessageService
from database.database import get_db
from api.dependencies import get_current_user

router = APIRouter(tags=["消息中心"]) 

@router.post("/", response_model=ApiResponse[MessageResponse], summary="创建消息并投递给接收人")
async def create_message(payload: MessageCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        # 默认使用当前登录用户作为触发者
        if payload.actor_id is None:
            payload.actor_id = current_user.id
        svc = MessageService(db)
        result = await svc.create_message(payload)
        return ApiResponse(code=201, message="创建成功", data=result, success=True)
    except Exception as e:
        return ApiResponse(code=400, message=f"创建失败: {e}", data=None, success=False)

@router.get("/my", response_model=ApiResponse[List[UserNotificationResponse]], summary="我的通知列表")
async def list_my_notifications(
    read: Optional[bool] = Query(None, description="是否已读，留空表示全部"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    svc = MessageService(db)
    data = await svc.list_user_notifications(current_user.id, read, skip, limit)
    return ApiResponse(code=200, message="ok", data=data, success=True)

@router.get("/my/unread-count", response_model=ApiResponse[int], summary="我的未读数量")
async def get_unread_count(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    svc = MessageService(db)
    count = await svc.unread_count(current_user.id)
    return ApiResponse(code=200, message="ok", data=count, success=True)

@router.post("/my/{recipient_id}/read", response_model=ApiResponse[dict], summary="标记单条为已读")
async def mark_read(recipient_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    svc = MessageService(db)
    ok = await svc.mark_read(recipient_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在或无权限")
    return ApiResponse(code=200, message="ok", data={"id": recipient_id, "read": True}, success=True)

@router.post("/my/read-all", response_model=ApiResponse[dict], summary="全部标记为已读")
async def mark_all_read(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    svc = MessageService(db)
    count = await svc.mark_all_read(current_user.id)
    return ApiResponse(code=200, message="ok", data={"affected": count}, success=True)
