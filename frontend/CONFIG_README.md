# ZenBoard 配置说明

## 环境变量配置

### 公司信息配置
在 `.env` 文件中配置以下变量：

```bash
# 公司信息
VITE_COMPANY_NAME=万店盈利公司
VITE_COPYRIGHT_YEAR=2025
```

### 修改公司信息
如果需要修改公司名称或版权年份，只需要：

1. 修改 `.env` 文件中的对应值
2. 重启开发服务器

**无需修改任何代码文件！**

## 配置文件结构

项目使用 `src/config/app.ts` 文件来集中管理配置信息：

```typescript
export const appConfig = {
  // 公司信息
  company: {
    name: import.meta.env.VITE_COMPANY_NAME || '万店盈利公司',
    copyrightYear: import.meta.env.VITE_COPYRIGHT_YEAR || '2025',
  },
  
  // 应用信息
  app: {
    name: 'ZenBoard',
    version: '1.0.0',
    description: '高效的项目管理和团队协作平台',
    slogan: '让工作更高效',
    fullName: '团队协作平台',
    englishName: 'Team Collaboration',
  },
  
  // 页面标题
  pageTitles: {
    login: '登录 - 团队协作平台',
    dashboard: '仪表板 - 团队协作平台',
    default: '管理后台系统',
  },
  
  // API 配置
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    proxyTarget: import.meta.env.VITE_PROXY_TARGET || 'http://localhost:8000',
    proxyPathPrefix: import.meta.env.VITE_PROXY_PATH_PREFIX || '/api',
  },
} as const;
```

## 已更新的组件

以下组件已经更新为使用配置文件：

1. **Dashboard.tsx** - 仪表板页面
2. **Login.tsx** - 登录页面  
3. **LoadingScreen.tsx** - 加载屏幕组件

## 使用方式

在组件中导入并使用配置：

```typescript
import { appConfig } from '@/config/app';

// 使用公司名称
const companyName = appConfig.company.name;

// 使用版权年份
const copyrightYear = appConfig.company.copyrightYear;

// 使用应用信息
const appName = appConfig.app.name;
const appDescription = appConfig.app.description;
const appFullName = appConfig.app.fullName;
const appEnglishName = appConfig.app.englishName;

// 使用页面标题
const loginTitle = appConfig.pageTitles.login;
```

## 优势

1. **集中管理**: 所有配置信息都在一个文件中
2. **类型安全**: TypeScript 提供完整的类型检查
3. **易于维护**: 修改配置只需改一个地方
4. **环境隔离**: 不同环境可以使用不同的配置
5. **默认值**: 提供合理的默认值，避免配置缺失
6. **一致性**: 确保所有组件使用相同的配置信息

## 注意事项

- 所有环境变量必须以 `VITE_` 开头才能在客户端代码中访问
- 修改环境变量后需要重启开发服务器
- 生产环境部署时需要确保环境变量正确设置
- 配置文件使用 `as const` 确保类型推断的准确性

## 扩展配置

如果需要添加新的配置项：

1. 在 `appConfig` 对象中添加新的配置项
2. 在 `.env` 文件中添加对应的环境变量（如果需要）
3. 在组件中使用新的配置项

这样可以保持配置的一致性和可维护性。