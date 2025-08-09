import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/MainLayout';
import Profile from './pages/Profile';
import SystemConfig from './pages/SystemConfig';
import CompleteProfile from './pages/CompleteProfile';
import PendingReview from './pages/PendingReview';
import ProtectedRoute from './components/ProtectedRoute';
import { routes } from './routes';
import type { RouteConfig } from './routes';
import { lazyPage } from './lazyPage';

// 渲染路由的函数
const renderRoutes = (routeList: RouteConfig[]): React.ReactElement[] => {
  const elements: React.ReactElement[] = [];
  
  routeList.forEach(route => {
    console.log('Processing route:', route.path);
    
    // 如果有子路由，递归处理
    if (route.children && route.children.length > 0) {
      console.log('Route has children, processing children...');
      elements.push(...renderRoutes(route.children));
    } else {
      // 没有子路由，处理当前路由
      console.log('Getting component for path:', route.path);
      const Component = lazyPage(route.path);
      if (Component) {
        console.log('Component found, creating route element');
        elements.push(
      <Route
        key={route.path}
            path={route.path}
            element={<Component />}
      />
  );
      } else {
        console.log('No component found for path:', route.path);
}
    }
  });
  
  console.log('Total route elements created:', elements.length);
  return elements;
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
      <Routes>
          {/* 登录页面 - 不需要保护 */}
        <Route path="/login" element={<Login />} />
          
          {/* 完善资料页面 - 需要保护 */}
          <Route path="/complete-profile" element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          } />
          
          {/* 等待审核页面 - 需要保护 */}
          <Route path="/pending-review" element={
            <ProtectedRoute>
              <PendingReview />
            </ProtectedRoute>
          } />
          
          {/* 主布局路由 - 需要保护 */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
          {/* 首页 */}
            <Route index element={<Dashboard />} />
          
          {/* 个人资料页面 */}
            <Route path="settings/profile" element={<Profile />} />
          
          {/* 系统配置页面 */}
            <Route path="settings/system" element={<SystemConfig />} />
          
          {/* 动态路由 */}
          {renderRoutes(routes)}
          </Route>
          
          {/* 默认重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
