from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from api.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from models.comment import Comment
from models.task import Task
from models.user import User
import logging

logger = logging.getLogger(__name__)

class CommentService:
    def __init__(self, db: Session):
        self.db = db

    def _get_comment_response(self, comment: Comment) -> CommentResponse:
        """将 Comment 对象转换为 CommentResponse，包含作者信息"""
        return CommentResponse(
            id=comment.id,
            content=comment.content,
            author_id=comment.author_id,
            author_name=comment.author.name if comment.author else None,
            task_id=comment.task_id,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )

    async def create_comment(self, comment: CommentCreate, author_id: int) -> CommentResponse:
        """创建评论"""
        try:
            # 验证任务是否存在（如果提供了任务ID）
            if comment.task_id:
                task = self.db.query(Task).filter(Task.id == comment.task_id).first()
                if not task:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="关联的任务不存在"
                    )
            
            # 创建新评论
            new_comment = Comment(
                content=comment.content,
                author_id=author_id,
                task_id=comment.task_id
            )
            
            self.db.add(new_comment)
            self.db.commit()
            self.db.refresh(new_comment)
            
            # 重新查询以获取作者信息
            comment_with_author = self.db.query(Comment).options(
                joinedload(Comment.author)
            ).filter(Comment.id == new_comment.id).first()
            
            return self._get_comment_response(comment_with_author)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"创建评论失败: {e}")
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="创建评论失败"
            )

    async def get_comments(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        task_id: Optional[int] = None
    ) -> List[CommentResponse]:
        """获取评论列表"""
        try:
            query = self.db.query(Comment).options(joinedload(Comment.author))
            
            # 根据过滤条件筛选
            if task_id is not None:
                query = query.filter(Comment.task_id == task_id)
            
            # 按创建时间倒序排列
            comments = query.order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()
            
            # 转换为响应模型列表
            return [self._get_comment_response(comment) for comment in comments]
            
        except Exception as e:
            logger.error(f"获取评论列表失败: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="获取评论列表失败"
            )

    async def get_comment(self, comment_id: int, user_id: int) -> CommentResponse:
        """获取评论详情"""
        try:
            comment = self.db.query(Comment).options(
                joinedload(Comment.author)
            ).filter(Comment.id == comment_id).first()
            
            if comment is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="评论不存在"
                )
            
            return self._get_comment_response(comment)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"获取评论详情失败: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="获取评论详情失败"
            )

    async def update_comment(
        self,
        comment_id: int,
        comment_update: CommentUpdate,
        user_id: int
    ) -> CommentResponse:
        """更新评论"""
        try:
            comment = self.db.query(Comment).filter(Comment.id == comment_id).first()
            if comment is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="评论不存在"
                )
            
            # 检查权限：只有评论作者才能更新
            if comment.author_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="无权限更新该评论"
                )
            
            # 更新评论内容
            comment.content = comment_update.content
            
            self.db.commit()
            self.db.refresh(comment)
            
            # 重新查询以获取作者信息
            comment_with_author = self.db.query(Comment).options(
                joinedload(Comment.author)
            ).filter(Comment.id == comment_id).first()
            
            return self._get_comment_response(comment_with_author)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"更新评论失败: {e}")
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="更新评论失败"
            )

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