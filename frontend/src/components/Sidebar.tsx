import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";
import { routes } from '../routes';
import type { RouteConfig } from '../routes';
import "../App.css";
import type { MenuProps } from 'antd';
import { appConfig } from '@/config/app';

interface SidebarProps {
  onMenuClick?: (key: string) => void;
  collapsed?: boolean;
  isDark?: boolean;
}

// 获取用户信息
const getUserInfo = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo');
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  } catch (error) {
    console.error('解析用户信息失败:', error);
    return null;
  }
};

// 检查用户是否有权限访问某个路由
const hasPermission = (route: RouteConfig): boolean => {
  const userInfo = getUserInfo();
  if (!userInfo) return false;
  
  const userRole = userInfo.role;
  
  // 普通用户不能访问的菜单
  const restrictedMenus = ['/user', '/settings'];
  
  if (userRole === '普通用户') {
    // 检查路径是否在限制列表中，包括子路径
    return !restrictedMenus.some(restrictedPath => 
      route.path === restrictedPath || route.path.startsWith(restrictedPath + '/')
    );
  }
  
  // 管理员可以访问所有菜单
  return true;
};

function getOpenKeys(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 1) {
    // 特殊处理：项目列表现在在任务管理菜单下
    if (pathname === '/project/list') {
      return ['/task'];
    }
    // 处理用户列表
    if (pathname === '/user/list') {
      return ['/user'];
    }
    return [`/${segments[0]}`];
  }
  
  // 处理根路径的情况
  if (pathname === '/user') {
    return ['/user'];
  }
  
  return [];
}

const renderMenuItems = (routes: RouteConfig[]): MenuProps['items'] =>
  routes
    .filter(route => !route.meta?.hiddenInSidebar) // 过滤掉隐藏的路由
    .filter(route => hasPermission(route)) // 根据用户角色过滤
    .map(route => ({
      key: route.path,
      icon: route.icon,
      label: route.children ? route.label : <Link to={route.path}>{route.label}</Link>,
      children: route.children ? renderMenuItems(route.children) : undefined,
    }));

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick, collapsed = false, isDark = false }) => {
  const location = useLocation();
  // 受控 openKeys 状态
  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys(location.pathname));

  // 路由变化时自动展开
  useEffect(() => {
    setOpenKeys(getOpenKeys(location.pathname));
  }, [location.pathname]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (onMenuClick) onMenuClick(e.key);
  };

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const sidebarBg = isDark ? '#111827' : '#ffffff';
  const sidebarText = isDark ? '#e5e7eb' : '#1f2937';
  const borderColor = isDark ? '#1f2937' : '#f0f0f0';

  return (
    <aside
      className={`fixed h-full z-30 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
      style={{ backgroundColor: sidebarBg, color: sidebarText, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="flex flex-col flex-1">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {appConfig.app.fullName}
            </h1>
            <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{appConfig.app.englishName}</p>
          </div>
        )}
      </div>
      
      <nav className={collapsed ? 'py-4 px-0' : 'p-4'}>
        <Menu
          mode="inline"
          theme={isDark ? 'dark' : 'light'}
          selectedKeys={[location.pathname]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
          className="border-0"
          inlineCollapsed={collapsed}
          style={{ borderInlineEnd: 'none', boxShadow: 'none', background: 'transparent' }}
          items={renderMenuItems(routes)}
        />
      </nav>
    </aside>
  );
};

export default Sidebar;
