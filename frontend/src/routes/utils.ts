import type { RouteConfig } from './types';

/**
 * 扁平化路由配置
 * @param routes 路由配置数组
 * @returns 扁平化的路由配置
 */
export function flattenRoutes(routes: RouteConfig[]): RouteConfig[] {
  const result: RouteConfig[] = [];
  
  function flatten(routes: RouteConfig[]) {
    routes.forEach(route => {
      result.push(route);
      if (route.children) {
        flatten(route.children);
      }
    });
  }
  
  flatten(routes);
  return result;
}

/**
 * 根据路径查找路由配置
 * @param routes 路由配置数组
 * @param path 路径
 * @returns 找到的路由配置或 null
 */
export function findRouteByPath(routes: RouteConfig[], path: string): RouteConfig | null {
  const flattened = flattenRoutes(routes);
  return flattened.find(route => route.path === path) || null;
}

/**
 * 获取面包屑导航
 * @param routes 路由配置数组
 * @param currentPath 当前路径
 * @returns 面包屑数组
 */
export function getBreadcrumbs(routes: RouteConfig[], currentPath: string): RouteConfig[] {
  const breadcrumbs: RouteConfig[] = [];
  
  function findPath(routes: RouteConfig[], path: string): boolean {
    for (const route of routes) {
      if (route.path === path) {
        breadcrumbs.push(route);
        return true;
      }
      if (route.children) {
        breadcrumbs.push(route);
        if (findPath(route.children, path)) {
          return true;
        }
        breadcrumbs.pop();
      }
    }
    return false;
  }
  
  findPath(routes, currentPath);
  return breadcrumbs;
} 