import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // 检查登录状态
  const isLoggedIn = localStorage.getItem('isLogin') === '1';
  
  // 如果未登录，重定向到登录页面
  if (!isLoggedIn) {
    // 保存当前路径，登录后可以跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 如果已登录，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute; 