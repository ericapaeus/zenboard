from pydantic import BaseModel, Field
from typing import Any, Optional, TypeVar, Generic

# 定义一个泛型类型变量，用于data字段
T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    """
    统一的API响应模型。
    """
    code: int = Field(..., description="响应状态码")
    message: str = Field(..., description="响应消息")
    data: Optional[T] = Field(None, description="响应数据")
    success: bool = Field(..., description="指示请求是否成功")

    class Config:
        arbitrary_types_allowed = True  # 允许任意类型，以支持泛型 