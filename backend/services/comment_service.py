from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from api.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from models.comment import Comment
import logging

logger = logging.getLogger(__name__)

class CommentService:
    def __init__(self, db: Session):
        self.db = db

    async def create_comment(self, comment: CommentCreate, author_id: int) -> CommentResponse:
        """创建评论"""
        # TODO: 实现评论创建逻辑
        pass

    async def get_comments(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        task_id: Optional[int] = None,
        diary_entry_id: Optional[int] = None
    ) -> List[CommentResponse]:
        """获取评论列表"""
        # TODO: 实现获取评论列表逻辑
        pass

    async def get_comment(self, comment_id: int, user_id: int) -> CommentResponse:
        """获取评论详情"""
        # TODO: 实现获取评论详情逻辑
        pass

    async def update_comment(
        self,
        comment_id: int,
        comment_update: CommentUpdate,
        user_id: int
    ) -> CommentResponse:
        """更新评论"""
        # TODO: 实现评论更新逻辑
        pass

    async def delete_comment(self, comment_id: int, user_id: int):
        """删除评论（仅作者可删）"""
        comment: Comment | None = self.db.query(Comment).filter(Comment.id == comment_id).first()
        if comment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="评论不存在")

        if comment.author_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权限删除该评论")

        try:
            self.db.delete(comment)
            self.db.commit()
            return {"deleted": True}
        except Exception as e:
            logger.error(f"删除评论失败: {e}")
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="删除评论失败") 