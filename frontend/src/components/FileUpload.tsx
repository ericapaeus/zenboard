import React from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useFileUpload } from '@/hooks/useApi';

interface FileUploadProps {
  type: 'avatar' | 'document' | 'image';
  onSuccess?: (data: { url: string; filename: string; size: number; type: string }) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSize?: number; // MB
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  type,
  onSuccess,
  onError,
  accept,
  maxSize = 2,
  buttonText = '上传文件',
  buttonIcon = <UploadOutlined />,
  disabled = false,
  className,
}) => {
  const { uploadFile, uploading } = useFileUpload();

  const handleUpload = async (file: File) => {
    try {
      const result = await uploadFile(file, type);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    beforeUpload: (file) => {
      // 检查文件类型
      if (accept && !accept.includes(file.type)) {
        message.error(`只支持 ${accept} 格式的文件！`);
        return false;
      }

      // 检查文件大小
      const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
      if (!isLtMaxSize) {
        message.error(`文件大小不能超过 ${maxSize}MB！`);
        return false;
      }

      // 处理文件上传
      handleUpload(file);
      return false; // 阻止自动上传
    },
  };

  return (
    <Upload {...uploadProps}>
      <Button
        icon={uploading ? <LoadingOutlined /> : buttonIcon}
        loading={uploading}
        disabled={disabled || uploading}
        className={className}
      >
        {uploading ? '上传中...' : buttonText}
      </Button>
    </Upload>
  );
};

export default FileUpload; 