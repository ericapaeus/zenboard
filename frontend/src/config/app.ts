// 应用配置文件
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