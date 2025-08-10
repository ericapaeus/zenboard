from pydantic import BaseModel
from typing import Optional, Dict, Any
from enum import Enum


class UploadType(str, Enum):
    """上传文件类型枚举"""
    avatar = "avatar"
    image = "image"
    document = "document"


class FileData(BaseModel):
    """文件数据模型"""
    url: str
    filename: str
    original_filename: Optional[str] = None
    size: int
    type: str


class UploadResponse(BaseModel):
    """文件上传响应模型"""
    success: bool
    message: str
    data: FileData
    code: int = 200


class UploadRequest(BaseModel):
    """文件上传请求模型"""
    type: UploadType = UploadType.image


class DeleteFileResponse(BaseModel):
    """删除文件响应模型"""
    success: bool
    message: str
    code: int = 200 