#!/usr/bin/env python3
"""
重建数据库脚本 - 删除旧表并创建新的表结构
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import engine
from database.base import Base
from sqlalchemy import text

def rebuild_database():
    """重建数据库"""
    try:
        with engine.connect() as connection:
            print("开始重建数据库...")
            
            # 删除所有表（除了 alembic_version）
            print("删除旧表...")
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name != 'alembic_version'"))
            tables = [row[0] for row in result]
            
            for table in tables:
                print(f"  删除表: {table}")
                connection.execute(text(f"DROP TABLE IF EXISTS {table}"))
            
            # 提交更改
            connection.commit()
            print("旧表删除完成")
            
            # 创建新表
            print("创建新表...")
            Base.metadata.create_all(bind=engine)
            print("新表创建完成")
            
            # 验证新表
            print("验证新表结构...")
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            new_tables = [row[0] for row in result]
            
            print("数据库中的表:")
            for table in new_tables:
                print(f"  - {table}")
                
            print("\n数据库重建完成！")
            
    except Exception as e:
        print(f"重建数据库时出错: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("警告：此操作将删除所有数据！")
    response = input("确定要继续吗？(y/N): ")
    if response.lower() == 'y':
        rebuild_database()
    else:
        print("操作已取消") 