import React from 'react';
import { appConfig } from '@/config/app';

export default function Dashboard() {
  return (
    <>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        
        {/* 装饰性圆圈 */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-purple-200 rounded-full opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-green-200 rounded-full opacity-25 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* 装饰性线条 */}
        <div className="absolute top-1/3 left-10 w-1 h-32 bg-gradient-to-b from-blue-400 to-transparent opacity-30"></div>
        <div className="absolute bottom-1/3 right-16 w-1 h-24 bg-gradient-to-b from-purple-400 to-transparent opacity-30"></div>
        
        {/* 网格背景 */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      {/* 欢迎区域 */}
      <div className="relative text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">欢迎您登录系统！</h1>
        <p className="text-xl text-gray-600 mb-8">{appConfig.app.description}</p>
        
        {/* 系统信息 */}
        <div className="mt-16 text-gray-500">
          <p className="text-sm">{appConfig.app.name} v{appConfig.app.version} | {appConfig.app.slogan}</p>
        </div>
      </div>

      {/* 版权信息 */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-gray-400 text-sm select-none">© {appConfig.company.copyrightYear} {appConfig.company.name} 版权所有</p>
      </div>
    </>
  );
}