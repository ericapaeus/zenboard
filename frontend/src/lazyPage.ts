import React from 'react';

// 页面组件映射
const pageComponents: Record<string, React.ComponentType> = {
  '/': React.lazy(() => import('./pages/Dashboard')),
  '/team/members': React.lazy(() => import('./pages/TeamMembers')),
  '/documents/list': React.lazy(() => import('./pages/MyDiaries')),
  '/tasks/list': React.lazy(() => import('./pages/MyTasks')),
  '/projects/list': React.lazy(() => import('./pages/MyProjects')),
  '/settings/system': React.lazy(() => import('./pages/SystemConfig')),
  '/settings/profile': React.lazy(() => import('./pages/Profile')),
  '/complete-profile': React.lazy(() => import('./pages/CompleteProfile')),
  '/pending-review': React.lazy(() => import('./pages/PendingReview')),
};

export function lazyPage(path: string): React.ComponentType | null {
  console.log('lazyPage called with path:', path);
  console.log('Available paths:', Object.keys(pageComponents));
  const component = pageComponents[path];
  console.log('Found component:', component ? 'Yes' : 'No');
  return component || null;
}
