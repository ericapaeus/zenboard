import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { appConfig } from '@/config/app';

interface LoadingScreenProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  tip = '正在加载中...', 
  size = 'large' 
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      {/* Logo区域 */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {appConfig.app.fullName}
        </h1>
        <p className="text-gray-500 text-sm mt-2">{appConfig.company.name}</p>
      </div>
      
      {/* 加载动画 */}
      <div className="flex flex-col items-center">
        <Spin indicator={antIcon} size={size} />
        <p className="text-gray-600 mt-4 text-sm">{tip}</p>
      </div>
      
      {/* 底部版权信息 */}
      <div className="absolute bottom-8 text-center">
        <p className="text-gray-400 text-xs">© {appConfig.company.copyrightYear} {appConfig.company.name} 版权所有</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 