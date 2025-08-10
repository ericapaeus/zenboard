import React from 'react';
import { Card, Space, message } from 'antd';
import { UploadOutlined, FileTextOutlined, PictureOutlined } from '@ant-design/icons';
import FileUpload from './FileUpload';

// 文件上传使用示例
const FileUploadExample: React.FC = () => {
  // 处理头像上传
  const handleAvatarUpload = (data: { url: string; filename: string; size: number; type: string }) => {
    console.log('头像上传成功:', data);
    message.success('头像上传成功！');
  };

  // 处理文档上传
  const handleDocumentUpload = (data: { url: string; filename: string; size: number; type: string }) => {
    console.log('文档上传成功:', data);
    message.success('文档上传成功！');
  };

  // 处理图片上传
  const handleImageUpload = (data: { url: string; filename: string; size: number; type: string }) => {
    console.log('图片上传成功:', data);
    message.success('图片上传成功！');
  };

  // 处理上传错误
  const handleUploadError = (error: Error) => {
    console.error('上传失败:', error);
    message.error('上传失败，请重试');
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">文件上传示例</h2>
      
      <Space direction="vertical" size="large" className="w-full">
        {/* 头像上传示例 */}
        <Card title="头像上传" size="small">
          <FileUpload
            type="avatar"
            onSuccess={handleAvatarUpload}
            onError={handleUploadError}
            accept="image/jpeg,image/png"
            maxSize={2}
            buttonText="上传头像"
            buttonIcon={<PictureOutlined />}
          />
          <p className="text-gray-500 text-sm mt-2">
            支持 JPG/PNG 格式，最大 2MB
          </p>
        </Card>

        {/* 文档上传示例 */}
        <Card title="文档上传" size="small">
          <FileUpload
            type="document"
            onSuccess={handleDocumentUpload}
            onError={handleUploadError}
            accept=".pdf,.doc,.docx,.txt"
            maxSize={10}
            buttonText="上传文档"
            buttonIcon={<FileTextOutlined />}
          />
          <p className="text-gray-500 text-sm mt-2">
            支持 PDF/DOC/TXT 格式，最大 10MB
          </p>
        </Card>

        {/* 图片上传示例 */}
        <Card title="图片上传" size="small">
          <FileUpload
            type="image"
            onSuccess={handleImageUpload}
            onError={handleUploadError}
            accept="image/*"
            maxSize={5}
            buttonText="上传图片"
            buttonIcon={<UploadOutlined />}
          />
          <p className="text-gray-500 text-sm mt-2">
            支持所有图片格式，最大 5MB
          </p>
        </Card>
      </Space>
    </div>
  );
};

export default FileUploadExample; 