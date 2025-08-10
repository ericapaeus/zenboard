# 文件上传功能文档

## 概述

ZenBoard 后端提供了完整的文件上传功能，支持头像、图片和文档的上传、获取和删除。

## 功能特性

- ✅ **多种文件类型支持**：头像、普通图片、文档
- ✅ **文件类型验证**：严格的 MIME 类型检查
- ✅ **文件大小限制**：不同类型文件有不同的大小限制
- ✅ **图片自动压缩**：头像和图片自动调整大小和压缩
- ✅ **安全文件存储**：UUID 文件名，防止冲突和猜测
- ✅ **权限控制**：需要登录才能上传和删除文件
- ✅ **RESTful API**：标准的 REST 接口设计

## API 接口

### 1. 文件上传

**POST** `/api/upload/file`

**请求参数：**
- `file`: 文件（multipart/form-data）
- `type`: 文件类型（form 参数）
  - `avatar`: 头像（最大 2MB）
  - `image`: 普通图片（最大 5MB）
  - `document`: 文档（最大 10MB）

**请求头：**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**响应示例：**
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "url": "/api/upload/files/avatar/12345678-1234-1234-1234-123456789abc.jpg",
    "filename": "12345678-1234-1234-1234-123456789abc.jpg",
    "original_filename": "my_avatar.jpg",
    "size": 45678,
    "type": "image/jpeg"
  },
  "code": 200
}
```

### 2. 获取文件

**GET** `/api/upload/files/{file_type}/{filename}`

**路径参数：**
- `file_type`: 文件类型（avatar, image, document）
- `filename`: 文件名

**响应：**
- 成功：返回文件内容
- 失败：返回 404 或错误信息

### 3. 删除文件

**DELETE** `/api/upload/files/{file_type}/{filename}`

**请求头：**
```
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## 支持的文件类型

### 图片文件（头像和普通图片）
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### 文档文件
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- 纯文本 (.txt)

## 文件大小限制

| 类型 | 最大大小 |
|------|----------|
| 头像 | 2MB |
| 普通图片 | 5MB |
| 文档 | 10MB |

## 图片处理

### 头像处理
- 自动调整为最大 400x400 像素
- 保持宽高比
- JPEG 格式输出，85% 质量
- RGBA 图片自动转换为 RGB

### 普通图片处理
- 自动调整为最大 1200x1200 像素
- 保持宽高比
- JPEG 格式输出，85% 质量
- RGBA 图片自动转换为 RGB

## 文件存储结构

```
uploads/
├── avatars/          # 头像文件
├── images/           # 普通图片
└── documents/        # 文档文件
```

## 错误处理

### 常见错误代码

| 错误码 | 说明 |
|--------|------|
| 400 | 文件类型不支持 / 文件过大 / 参数错误 |
| 401 | 未授权（需要登录） |
| 404 | 文件不存在 |
| 500 | 服务器内部错误 |

### 错误响应示例

```json
{
  "detail": "文件大小不能超过 2MB"
}
```

## 使用示例

### JavaScript/TypeScript

```typescript
// 上传头像
const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'avatar');

  const response = await fetch('/api/upload/file', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  });

  return response.json();
};

// 获取文件
const getFile = (fileUrl: string) => {
  return `${baseUrl}${fileUrl}`;
};
```

### Python

```python
import requests

def upload_file(file_path, file_type, access_token):
    url = "http://localhost:8000/api/upload/file"
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    files = {
        "file": ("filename.jpg", open(file_path, "rb"), "image/jpeg")
    }
    
    data = {
        "type": file_type
    }
    
    response = requests.post(url, files=files, data=data, headers=headers)
    return response.json()
```

### cURL

```bash
# 上传头像
curl -X POST "http://localhost:8000/api/upload/file" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@avatar.jpg" \
  -F "type=avatar"

# 获取文件
curl "http://localhost:8000/api/upload/files/avatar/filename.jpg"

# 删除文件
curl -X DELETE "http://localhost:8000/api/upload/files/avatar/filename.jpg" \
  -H "Authorization: Bearer your_token_here"
```

## 安全考虑

1. **文件类型验证**：严格检查 MIME 类型
2. **文件大小限制**：防止大文件攻击
3. **权限控制**：上传和删除需要认证
4. **文件名安全**：使用 UUID 防止路径遍历
5. **图片处理**：自动压缩减少存储空间

## 部署注意事项

1. 确保 `uploads` 目录有写权限
2. 配置 Nginx 或其他 Web 服务器处理静态文件
3. 定期清理未使用的文件
4. 考虑使用 CDN 加速文件访问
5. 备份重要文件

## 依赖项

- `Pillow`: 图片处理
- `python-multipart`: 文件上传支持
- `fastapi`: Web 框架

## 测试

运行测试脚本：

```bash
python test_upload.py
```

注意：需要先替换脚本中的 `ACCESS_TOKEN` 为有效的访问令牌。 