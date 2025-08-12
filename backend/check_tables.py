#!/usr/bin/env python3
"""
检查数据库表结构的脚本
"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import engine
from sqlalchemy import text

def check_database_tables():
    """检查数据库中的表结构"""
    try:
        with engine.connect() as connection:
            # 获取所有表名
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in result]
            
            print("数据库中的表:")
            for table in tables:
                print(f"  - {table}")
            
            # 检查特定表是否存在
            print("\n检查关键表:")
            key_tables = ['project', 'projects', 'task', 'tasks', 'user', 'users']
            for table in key_tables:
                result = connection.execute(text(f"SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='{table}'"))
                exists = result.scalar()
                print(f"  - {table}: {'存在' if exists else '不存在'}")
                
    except Exception as e:
        print(f"检查数据库时出错: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database_tables() 