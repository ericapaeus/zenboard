import React from "react";

const pageMap: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks/my': 'MyTasks',
  '/tasks/projects': 'ProjectTasks',
  '/tasks/private': 'PrivateTasks',
  // 其它页面可继续补充
};

export function lazyPage(path: string) {
  const fileName = pageMap[path] || 'Dashboard';
  return React.lazy(() => import(`./pages/${fileName}`));
} 