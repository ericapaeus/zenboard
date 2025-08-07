import React from 'react';
import {
  DashboardOutlined, TeamOutlined, ProjectOutlined, CheckSquareOutlined,
  FileTextOutlined, SettingOutlined, UserOutlined, CalendarOutlined,
  MessageOutlined, UnorderedListOutlined, PlusOutlined, BookOutlined
} from '@ant-design/icons';

export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ReactNode;
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    label: '控制台',
    icon: <DashboardOutlined />,
  },
  {
    path: '/team',
    label: '团队管理',
    icon: <TeamOutlined />,
    children: [
      { path: '/team/members', label: '成员管理', icon: <UserOutlined /> },
      { path: '/team/approvals', label: '审批管理', icon: <UnorderedListOutlined /> },
      { path: '/team/contracts', label: '合同管理', icon: <CalendarOutlined /> },
    ],
  },
  {
    path: '/projects',
    label: '项目管理',
    icon: <ProjectOutlined />,
    children: [
      { path: '/projects/create', label: '创建项目', icon: <PlusOutlined /> },
      { path: '/projects/board', label: '团队公告板', icon: <DashboardOutlined /> },
      { path: '/projects/:projectId/tasks', label: '项目任务', icon: <CheckSquareOutlined /> },
    ],
  },
  {
    path: '/tasks',
    label: '任务管理',
    icon: <CheckSquareOutlined />,
    children: [
      { path: '/tasks/my', label: '我的任务', icon: <UserOutlined /> },
      { path: '/tasks/projects', label: '我的项目', icon: <ProjectOutlined /> },
      { path: '/tasks/private', label: '私有任务', icon: <BookOutlined /> },
    ],
  },
  {
    path: '/diary',
    label: '日记系统',
    icon: <FileTextOutlined />,
    children: [
      { path: '/diary/my', label: '我的日记', icon: <UserOutlined /> },
      { path: '/diary/shared', label: '共享日记', icon: <UnorderedListOutlined /> },
      { path: '/diary/create', label: '写日记', icon: <PlusOutlined /> },
    ],
  },
  { path: '/messages', label: '消息中心', icon: <MessageOutlined /> },
  {
    path: '/settings',
    label: '系统设置',
    icon: <SettingOutlined />,
    children: [
      { path: '/settings/profile', label: '个人资料', icon: <UserOutlined /> },
      { path: '/settings/system', label: '系统配置', icon: <SettingOutlined /> },
    ],
  },
]; 