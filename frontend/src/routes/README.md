# 路由配置

这个文件夹包含了应用的路由配置和相关工具函数。

## 文件结构

```
routes/
├── index.tsx      # 路由配置主文件
├── types.ts       # 路由类型定义
├── utils.ts       # 路由工具函数
└── README.md      # 说明文档
```

## 文件说明

### index.tsx
- 导出路由配置数组 `routes`
- 定义应用的所有路由路径和对应的组件
- 支持嵌套路由结构

### types.ts
- 定义路由相关的 TypeScript 类型
- `RouteConfig`: 路由配置接口
- `RouteMeta`: 路由元数据接口

### utils.ts
- 提供路由相关的工具函数
- `flattenRoutes`: 扁平化路由配置
- `findRouteByPath`: 根据路径查找路由
- `getBreadcrumbs`: 获取面包屑导航

## 使用示例

```typescript
import { routes, type RouteConfig } from './routes';
import { findRouteByPath, getBreadcrumbs } from './routes/utils';

// 查找特定路由
const route = findRouteByPath(routes, '/team/members');

// 获取面包屑
const breadcrumbs = getBreadcrumbs(routes, '/team/members');
```

## 路由配置规范

1. 每个路由都应该有唯一的 `path`
2. 使用 Ant Design 图标作为 `icon`
3. 支持嵌套路由，通过 `children` 属性定义
4. 路由标签使用中文，便于用户理解 