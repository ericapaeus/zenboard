import React from 'react';
import {
  DashboardOutlined, TeamOutlined, ProjectOutlined, CheckSquareOutlined,
  FileTextOutlined, SettingOutlined, UserOutlined
} from '@ant-design/icons';
import type { RouteConfig } from './types';

export const routes: RouteConfig[] = [
  {
    path: '/',
    label: '控制台',
    icon: <DashboardOutlined />,
  },
  {
    path: '/team',
    label: '成员管理',
    icon: <TeamOutlined />,
    children: [
      { path: '/team/members', label: '成员列表', icon: <UserOutlined /> },
    ],
  },
  {
    path: '/tasks',
    label: '任务管理',
    icon: <CheckSquareOutlined />,
    children: [
      { path: '/tasks/my', label: '任务列表', icon: <UserOutlined /> },
      { path: '/tasks/projects', label: '项目列表', icon: <ProjectOutlined /> },
    ],
  },
  {
    path: '/diary',
    label: '文档管理',
    icon: <FileTextOutlined />,
    children: [
      { path: '/diary/my', label: '文档列表', icon: <UserOutlined /> },
    ],
  },
  {
    path: '/settings',
    label: '系统设置',
    icon: <SettingOutlined />,
    children: [
      { path: '/settings/system', label: '系统配置', icon: <SettingOutlined /> },
    ],
  },
  {
    path: '/settings/profile',
    label: '个人资料',
    icon: <UserOutlined />,
    meta: { hiddenInSidebar: true },
  },
];

// 重新导出类型定义
export type { RouteConfig } from './types'; 