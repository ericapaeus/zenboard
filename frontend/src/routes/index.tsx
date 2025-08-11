import React, { lazy } from 'react';
import { UserOutlined, TeamOutlined, FileTextOutlined, SettingOutlined, UserSwitchOutlined, ProjectOutlined, CheckSquareOutlined, BookOutlined } from '@ant-design/icons';

// 懒加载页面组件
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Users = lazy(() => import('../pages/Users'));
const Projects = lazy(() => import('../pages/Projects'));
const Task = lazy(() => import('../pages/Task'));
const Document = lazy(() => import('../pages/Document'));
const SystemConfig = lazy(() => import('../pages/SystemConfig'));
const Profile = lazy(() => import('../pages/Profile'));

export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ReactNode;
  children?: RouteConfig[];
  meta?: {
    hiddenInSidebar?: boolean;
    parentPath?: string;
    component?: React.ComponentType; // 添加组件引用
  };
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    label: '工作台',
    icon: React.createElement(UserOutlined),
    meta: { component: Dashboard },
  },
  {
    path: '/users',
    label: '用户管理',
    icon: React.createElement(UserOutlined),
    children: [
      {
        path: '/users/list',
        label: '用户列表',
        icon: React.createElement(UserSwitchOutlined),
        meta: { component: Users },
      },
    ],
  },
  {
    path: '/tasks',
    label: '任务管理',
    icon: React.createElement(CheckSquareOutlined),
    children: [
      {
        path: '/projects/list',
        label: '项目列表',
        icon: React.createElement(ProjectOutlined),
        meta: { parentPath: '/tasks', component: Projects },
      },
      {
        path: '/tasks/list',
        label: '任务列表',
        icon: React.createElement(CheckSquareOutlined),
        meta: { component: Task },
      }
    ],
  },
  {
    path: '/document',
    label: '文档管理',
    icon: React.createElement(BookOutlined),
    children: [
      {
        path: '/document/list',
        label: '文档列表',
        icon: React.createElement(FileTextOutlined),
        meta: { component: Document },
      },
    ],
  },
  {
    path: '/settings',
    label: '系统设置',
    icon: React.createElement(SettingOutlined),
    children: [
      {
        path: '/settings/system',
        label: '系统配置',
        icon: React.createElement(SettingOutlined),
        meta: { component: SystemConfig },
      },
    ],
  },
  {
    path: '/profile',
    label: '个人资料',
    icon: React.createElement(UserOutlined),
    meta: { hiddenInSidebar: true, component: Profile },
  },
];

// 获取页面组件
export const getPageComponent = (path: string): React.ComponentType | null => {
  // 递归查找路由配置中的组件
  const findComponent = (routeList: RouteConfig[], targetPath: string): React.ComponentType | null => {
    for (const route of routeList) {
      if (route.path === targetPath && route.meta?.component) {
        return route.meta.component;
      }
      if (route.children) {
        const found = findComponent(route.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findComponent(routes, path);
};

// 获取所有路由路径（用于生成 React Router 路由）
export const getAllRoutePaths = (): Array<{ path: string; component: React.ComponentType }> => {
  const paths: Array<{ path: string; component: React.ComponentType }> = [];
  
  const extractPaths = (routeList: RouteConfig[]) => {
    routeList.forEach(route => {
      if (route.meta?.component) {
        paths.push({ path: route.path, component: route.meta.component });
      }
      if (route.children) {
        extractPaths(route.children);
      }
    });
  };
  
  extractPaths(routes);
  return paths;
};
