import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import { getAllRoutePaths } from './routes';

// 页面加载组件
const PageLoading: React.FC = () => {
  const antIcon = <LoadingOutlined style={{ fontSize: 20 }} spin />;
  
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center">
        <Spin indicator={antIcon} />
        <p className="text-gray-500 mt-2 text-sm">页面加载中...</p>
      </div>
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // 模拟应用初始化过程
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 显示1.5秒的加载动画

    return () => clearTimeout(timer);
  }, []);

  // 如果正在加载，显示加载屏幕
  if (isLoading) {
    return <LoadingScreen tip="正在初始化应用..." />;
  }

  // 获取所有路由配置
  const routePaths = getAllRoutePaths();

  return (
    <Router>
      <Routes>
        {/* 登录页面 - 不需要保护 */}
        <Route path="/login" element={<Login />} />
        
        {/* 完善资料页面 - 只允许"未审核"状态访问 */}
        <Route path="/complete-profile" element={
          <ProtectedRoute allowStatuses={["未审核"]}>
            <Suspense fallback={<PageLoading />}>
              {React.createElement(React.lazy(() => import('./pages/CompleteProfile')))}
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* 等待审核页面 - 只允许"待审核"状态访问 */}
        <Route path="/pending-review" element={
          <ProtectedRoute allowStatuses={["待审核"]}>
            <Suspense fallback={<PageLoading />}>
              {React.createElement(React.lazy(() => import('./pages/PendingReview')))}
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* 主布局路由 - 只允许"已通过"状态访问 */}
        <Route path="/" element={
          <ProtectedRoute allowStatuses={["已通过"]}>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* 动态生成所有路由 */}
          {routePaths.map(({ path, component: Component }) => (
            <Route 
              key={path} 
              path={path.replace(/^\//, '')} // 移除开头的斜杠，因为这是嵌套路由
              element={
                <Suspense fallback={<PageLoading />}>
                  <Component />
                </Suspense>
              } 
            />
          ))}
        </Route>
        
        {/* 默认重定向到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
