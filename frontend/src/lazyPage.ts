import React from "react";

const pathPatterns: Array<{ pattern: RegExp, componentName: string }> = [
  { pattern: /^\/$/, componentName: 'Dashboard' },
  { pattern: /^\/tasks\/my$/, componentName: 'MyTasks' },
  { pattern: /^\/tasks\/projects$/, componentName: 'MyProjects' },
  { pattern: /^\/tasks\/private$/, componentName: 'PrivateTasks' },
  { pattern: /^\/team\/members$/, componentName: 'TeamMembers' }, // Add mapping for TeamMembers
  { pattern: /^\/projects\/[^/]+\/tasks$/, componentName: 'ProjectTasks' }, // 匹配 /projects/任意ID/tasks
  { pattern: /^\/diary\/my$/, componentName: 'MyDiaries' },
  // 其它页面模式可继续补充
];

export function lazyPage(path: string) {
  for (const { pattern, componentName } of pathPatterns) {
    if (pattern.test(path)) {
      return React.lazy(() => import(`./pages/${componentName}`));
    }
  }
  // 如果没有匹配到任何模式，则回退到 Dashboard
  return React.lazy(() => import(`./pages/Dashboard`));
}
