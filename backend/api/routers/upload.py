from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
import mimetypes
from PIL import Image
import io

from ..dependencies import get_db, get_current_user
from models.user import User
from ..schemas.upload import UploadResponse, UploadType

router = APIRouter(prefix="/upload", tags=["upload"])

# 配置文件存储路径
UPLOAD_DIR = Path("uploads")
AVATAR_DIR = UPLOAD_DIR / "avatars"
DOCUMENT_DIR = UPLOAD_DIR / "documents"
IMAGE_DIR = UPLOAD_DIR / "images"

# 确保上传目录存在
for directory in [UPLOAD_DIR, AVATAR_DIR, DOCUMENT_DIR, IMAGE_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# 允许的文件类型
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"]
}

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
}

# 文件大小限制（字节）
MAX_FILE_SIZE = {
    "avatar": 2 * 1024 * 1024,    # 2MB
    "image": 5 * 1024 * 1024,     # 5MB
    "document": 10 * 1024 * 1024  # 10MB
}


def validate_file_type(file: UploadFile, upload_type: str) -> bool:
    """验证文件类型"""
    if upload_type == "avatar" or upload_type == "image":
        return file.content_type in ALLOWED_IMAGE_TYPES
    elif upload_type == "document":
        return file.content_type in ALLOWED_DOCUMENT_TYPES or file.content_type in ALLOWED_IMAGE_TYPES
    return False


def validate_file_size(file: UploadFile, upload_type: str) -> bool:
    """验证文件大小"""
    if upload_type not in MAX_FILE_SIZE:
        return False
    
    # 获取文件大小
    file.file.seek(0, 2)  # 移动到文件末尾
    size = file.file.tell()
    file.file.seek(0)  # 重置到文件开头
    
    return size <= MAX_FILE_SIZE[upload_type]


def get_file_extension(filename: str, content_type: str) -> str:
    """获取文件扩展名"""
    # 首先尝试从文件名获取
    if filename and "." in filename:
        return Path(filename).suffix.lower()
    
    # 从 MIME 类型获取
    if content_type in ALLOWED_IMAGE_TYPES:
        return ALLOWED_IMAGE_TYPES[content_type][0]
    elif content_type in ALLOWED_DOCUMENT_TYPES:
        return ALLOWED_DOCUMENT_TYPES[content_type][0]
    
    return ".bin"


def resize_image(image_data: bytes, max_size: tuple = (800, 800)) -> bytes:
    """调整图片大小"""
    try:
        image = Image.open(io.BytesIO(image_data))
        
        # 如果是 RGBA 模式，转换为 RGB
        if image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'RGBA':
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image, mask=image.split()[-1])
            image = background
        
        # 调整大小，保持宽高比
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # 保存到字节流
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"图片处理失败: {e}")
        return image_data


@router.post("/file", response_model=UploadResponse, summary="通用文件上传")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form("image"),
    current_user: User = Depends(get_current_user)
):
    """
    通用文件上传接口
    
    - **file**: 要上传的文件
    - **type**: 文件类型 (avatar, image, document)
    """
    try:
        # 验证上传类型
        if type not in ["avatar", "image", "document"]:
            raise HTTPException(status_code=400, detail="不支持的上传类型")
        
        # 验证文件类型
        if not validate_file_type(file, type):
            allowed_types = list(ALLOWED_IMAGE_TYPES.keys()) if type in ["avatar", "image"] else list(ALLOWED_DOCUMENT_TYPES.keys())
            raise HTTPException(
                status_code=400, 
                detail=f"不支持的文件类型。支持的类型: {', '.join(allowed_types)}"
            )
        
        # 验证文件大小
        if not validate_file_size(file, type):
            max_size_mb = MAX_FILE_SIZE[type] / (1024 * 1024)
            raise HTTPException(
                status_code=400, 
                detail=f"文件大小不能超过 {max_size_mb}MB"
            )
        
        # 生成唯一文件名
        file_extension = get_file_extension(file.filename, file.content_type)
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # 确定保存目录
        if type == "avatar":
            save_dir = AVATAR_DIR
        elif type == "document":
            save_dir = DOCUMENT_DIR
        else:
            save_dir = IMAGE_DIR
        
        file_path = save_dir / unique_filename
        
        # 读取文件内容
        file_content = await file.read()
        
        # 如果是图片，进行压缩处理
        if type in ["avatar", "image"] and file.content_type.startswith("image/"):
            if type == "avatar":
                file_content = resize_image(file_content, (400, 400))
            else:
                file_content = resize_image(file_content, (1200, 1200))
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # 生成文件URL
        file_url = f"/api/upload/files/{type}/{unique_filename}"
        
        return UploadResponse(
            success=True,
            message="文件上传成功",
            data={
                "url": file_url,
                "filename": unique_filename,
                "original_filename": file.filename,
                "size": len(file_content),
                "type": file.content_type
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"文件上传失败: {e}")
        raise HTTPException(status_code=500, detail="文件上传失败")


@router.get("/files/{file_type}/{filename}", summary="获取上传的文件")
async def get_uploaded_file(file_type: str, filename: str):
    """
    获取上传的文件
    
    - **file_type**: 文件类型 (avatar, image, document)
    - **filename**: 文件名
    """
    try:
        # 确定文件路径
        if file_type == "avatar":
            file_path = AVATAR_DIR / filename
        elif file_type == "image":
            file_path = IMAGE_DIR / filename
        elif file_type == "document":
            file_path = DOCUMENT_DIR / filename
        else:
            raise HTTPException(status_code=400, detail="不支持的文件类型")
        
        # 检查文件是否存在
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 获取 MIME 类型
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if not mime_type:
            mime_type = "application/octet-stream"
        
        return FileResponse(
            path=str(file_path),
            media_type=mime_type,
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"获取文件失败: {e}")
        raise HTTPException(status_code=500, detail="获取文件失败")


@router.delete("/files/{file_type}/{filename}", summary="删除上传的文件")
async def delete_uploaded_file(
    file_type: str, 
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除上传的文件
    
    - **file_type**: 文件类型 (avatar, image, document)
    - **filename**: 文件名
    """
    try:
        # 确定文件路径
        if file_type == "avatar":
            file_path = AVATAR_DIR / filename
        elif file_type == "image":
            file_path = IMAGE_DIR / filename
        elif file_type == "document":
            file_path = DOCUMENT_DIR / filename
        else:
            raise HTTPException(status_code=400, detail="不支持的文件类型")
        
        # 检查文件是否存在
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 删除文件
        file_path.unlink()
        
        return {
            "success": True,
            "message": "文件删除成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"删除文件失败: {e}")
        raise HTTPException(status_code=500, detail="删除文件失败") 