#!/usr/bin/env python3
"""
测试文档服务的脚本
"""
import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import get_db
from services.document_service import DocumentService
from models.document import Document
from models.user import User

async def test_document_service():
    """测试文档服务"""
    try:
        # 获取数据库会话
        db = next(get_db())
        
        # 创建文档服务实例
        svc = DocumentService(db)
        
        # 测试获取文档列表
        print("测试获取文档列表...")
        docs = await svc.get_documents(
            user_id=1,  # 假设用户ID为1
            skip=0,
            limit=10,
            order_by="-id"  # 测试降序排序
        )
        
        print(f"成功获取 {len(docs)} 个文档")
        for doc in docs:
            print(f"  - ID: {doc.id}, 标题: {doc.title}")
            
        print("测试完成！")
        
    except Exception as e:
        print(f"测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    asyncio.run(test_document_service()) 