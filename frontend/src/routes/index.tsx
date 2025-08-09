import React from 'react';
import {
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  UserSwitchOutlined,
  FileDoneOutlined,
  ProjectOutlined,
  TagsOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import type { RouteConfig } from './types';

export const routes: RouteConfig[] = [
  {
    path: '/',
    label: '首页',
    icon: <HomeOutlined />,
  },
  {
    path: '/team',
    label: '成员管理',
    icon: <TeamOutlined />,
    children: [
      {
        path: '/team/members',
        label: '成员列表',
        icon: <UserSwitchOutlined />,
      },
    ],
  },
  {
    path: '/tasks',
    label: '任务管理',
    icon: <CheckSquareOutlined />,
    children: [
      {
        path: '/projects/list',
        label: '项目列表',
        icon: <ProjectOutlined />,
      },
      {
        path: '/tasks/list',
        label: '任务列表',
        icon: <TagsOutlined />,
      },
     
    ],
  },
  {
    path: '/documents',
    label: '文档管理',
    icon: <FileTextOutlined />,
    children: [
      {
        path: '/documents/list',
        label: '文档列表',
        icon: <FileDoneOutlined />,
      },
    ],
  },
  {
    path: '/settings',
    label: '系统设置',
    icon: <SettingOutlined />,
    children: [
      {
        path: '/settings/system',
        label: '系统配置',
        icon: <ControlOutlined />,
      },
    ],
  },
  {
    path: '/settings/profile',
    label: '个人资料',
    icon: <UserOutlined />,
    meta: { hiddenInSidebar: true },
  },
  {
    path: '/complete-profile',
    label: '完善资料',
    icon: <UserOutlined />,
    meta: { hiddenInSidebar: true },
  },
  {
    path: '/pending-review',
    label: '等待审核',
    icon: <DashboardOutlined />,
    meta: { hiddenInSidebar: true },
  },
];

// 重新导出类型定义
export type { RouteConfig } from './types'; 