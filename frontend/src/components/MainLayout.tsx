import Sidebar from "./Sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumb, Avatar, Dropdown, Space, ConfigProvider, theme, Button, Tooltip } from "antd";
import { UserOutlined, SettingOutlined, LogoutOutlined, TranslationOutlined, FullscreenOutlined, FullscreenExitOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import { useState, useCallback, useEffect } from "react";
import { DesktopOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { routes, type RouteConfig } from '../routes';
import { appConfig } from '@/config/app';

// 简化的路由标签映射
const routeLabels: Record<string, string> = {
  '/': '控制台',
  '/user': '用户管理',
  '/user/list': '用户列表',
  '/project/list': '项目列表',
  '/task/list': '任务列表',
  '/document/list': '文档列表',
  '/settings/system': '系统配置',
  '/profile': '个人资料',
};

// 获取面包屑项
function getBreadcrumbItems(pathname: string) {
  const items = [{ title: '控制台' }];
  
  // 特殊处理各种列表路径，显示完整的三级路径
  if (pathname === '/user/list') {
    items.push({ title: '用户管理' });
    items.push({ title: '用户列表' });
    return items;
  }
  
  if (pathname === '/project/list') {
    items.push({ title: '任务管理' });
    items.push({ title: '项目列表' });
    return items;
  }
  
  if (pathname === '/task/list') {
    items.push({ title: '任务管理' });
    items.push({ title: '任务列表' });
    return items;
  }
  
  if (pathname === '/document/list') {
    items.push({ title: '文档管理' });
    items.push({ title: '文档列表' });
    return items;
  }
  
  if (pathname === '/settings/system') {
    items.push({ title: '系统设置' });
    items.push({ title: '系统配置' });
    return items;
  }
  
  // 根据路径获取标签
  const label = routeLabels[pathname];
  if (label && label !== '控制台') {
    items.push({ title: label });
  }
  
  return items;
}

// 获取标签页标签和图标
function getTabLabelByPath(path: string): React.ReactNode {
  const label = routeLabels[path];
  if (!label) return '未知页面';
  
  // 从路由配置中获取图标
  let icon = null;
  
  // 查找路由配置
  const findRouteIcon = (routes: RouteConfig[], targetPath: string): React.ReactNode | null => {
    for (const route of routes) {
      if (route.path === targetPath) {
        return route.icon || null;
      }
      if (route.children) {
        const found = findRouteIcon(route.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };
  
  icon = findRouteIcon(routes, path);
  
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon && <span className="text-gray-500">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 主题模式：system | light | dark
  const THEME_STORAGE_KEY = 'themeMode';
  const getInitialThemeMode = (): 'system' | 'light' | 'dark' => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as 'system' | 'light' | 'dark' | null;
    return saved || 'system';
  };
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(getInitialThemeMode());
  const mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(mediaQuery ? mediaQuery.matches : false);
  useEffect(() => {
    if (!mediaQuery) return;
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener?.('change', handler);
    return () => mediaQuery.removeEventListener?.('change', handler);
  }, []);
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  const handleThemeChange = ({ key }: { key: string }) => {
    const mode = key as 'system' | 'light' | 'dark';
    setThemeMode(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  };
  const themeMenuItems = [
    { key: 'system', icon: <DesktopOutlined />, label: '跟随系统' },
    { key: 'light', icon: <SunOutlined />, label: '浅色模式' },
    { key: 'dark', icon: <MoonOutlined />, label: '深色模式' },
  ];
  
  // 获取用户信息
  const getUserInfo = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  };
  
  const userInfo = getUserInfo();
  const userName = userInfo?.name || '管理员';
  const userRole = userInfo?.role || '管理员';
  const userAvatar = userInfo?.avatar; // 获取用户头像
  
  // 动态标签页（临时禁用）
  // const [tabs, setTabs] = useState<{ key: string; label: React.ReactNode; closable: boolean }[]>([
  //   { key: "/", label: getTabLabelByPath('/'), closable: false }
  // ]);
  // const [activeTab, setActiveTab] = useState("/");

  // 全屏功能
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('全屏请求失败:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('退出全屏失败:', err);
      });
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 侧边栏菜单点击，仅导航（标签页已禁用）
  const handleMenuClick = useCallback((key: string) => {
    navigate(key);
  }, [navigate]);

  // 路由变化时自动创建标签页（已禁用）
  // useEffect(() => {
  //   const currentPath = location.pathname;
  //   if (currentPath === '/') return; // 首页不需要创建标签页
  //   setTabs((prevTabs) => {
  //     if (prevTabs.find((tab) => tab.key === currentPath)) return prevTabs;
  //     return [
  //       ...prevTabs,
  //       { key: currentPath, label: getTabLabelByPath(currentPath), closable: currentPath !== "/" }
  //     ];
  //   });
  //   setActiveTab(currentPath);
  // }, [location.pathname]);

  // 标签页切换（已禁用）
  // const handleTabChange = (key: string) => {
  //   setActiveTab(key);
  //   navigate(key);
  // };

  // 标签页关闭（已禁用）
  // const handleTabEdit = (targetKey: string, action: "remove" | "add") => {
  //   if (action === "remove") {
  //     setTabs((prevTabs) => {
  //       const filtered = prevTabs.filter((tab) => tab.key !== targetKey);
  //       if (activeTab === targetKey && filtered.length > 0) {
  //         const lastTab = filtered[filtered.length - 1];
  //         setActiveTab(lastTab.key);
  //         navigate(lastTab.key);
  //       }
  //       return filtered;
  //     });
  //   }
  // };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人资料",
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
    },
  ];

  // 右上角操作菜单
  const actionMenuItems = [
    {
      key: "language",
      icon: <TranslationOutlined />,
      label: "语言设置",
    },
    {
      key: "fullscreen",
      icon: isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
      label: isFullscreen ? "退出全屏" : "全屏模式",
    },
  ];

  // 用户菜单点击事件
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      localStorage.removeItem("isLogin");
      navigate("/login");
    } else if (key === "profile") {
      // 跳转到个人资料页面，使用独立路径
      navigate("/profile");
    }
  };

  // 操作菜单点击事件
  const handleActionMenuClick = ({ key }: { key: string }) => {
    if (key === "fullscreen") {
      toggleFullscreen();
    }
  };

  return (
    <ConfigProvider theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
    <div className="flex h-screen font-sans overflow-x-hidden" style={{ backgroundColor: isDark ? '#0b1220' : '#f5f6f8', color: isDark ? '#e5e7eb' : '#1D2129' }}>
      <Sidebar 
        onMenuClick={handleMenuClick} 
        collapsed={sidebarCollapsed}
        isDark={isDark}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* 顶部导航栏 */}
        <header className="fixed top-0 right-0 z-20 shadow-sm border-b px-6 py-3 transition-all duration-300" style={{ left: sidebarCollapsed ? '80px' : '256px', backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1f2937' : '#f0f0f0' }}>
          <div className="flex items-center justify-between">
            {/* 左侧面包屑和收缩按钮 */}
            <div className="flex items-center">
              {/* 侧边栏收缩按钮（Ant Design） */}
              <Tooltip title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}>
                <Button
                  type="text"
                  size="large"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  className="mr-3"
                />
              </Tooltip>
              
              {/* 面包屑 */}
              <Breadcrumb 
                items={getBreadcrumbItems(location.pathname)} 
                className="text-sm"
              />
            </div>
            
            {/* 右侧用户信息和操作 */}
            <div className="flex items-center space-x-4">
              {/* 操作按钮 */}
              <Space size="small">
                {/* 主题切换（AntD Button 触发 Dropdown） */}
                <Dropdown menu={{ items: themeMenuItems, onClick: handleThemeChange }} placement="bottomRight">
                  <Button
                    type="text"
                    shape="circle"
                    icon={themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark) ? <MoonOutlined /> : <SunOutlined />}
                    aria-label="主题模式"
                  />
                </Dropdown>
                {/* 语言/其它操作 */}
                <Dropdown menu={{ items: actionMenuItems, onClick: handleActionMenuClick }} placement="bottomRight">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<TranslationOutlined />}
                    aria-label="操作"
                  />
                </Dropdown>
                {/* 全屏 */}
                <Tooltip title={isFullscreen ? "退出全屏" : "进入全屏"}>
                  <Button
                    type="text"
                    shape="circle"
                    onClick={toggleFullscreen}
                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
                  />
                </Tooltip>
              </Space>
              
              {/* 用户头像和下拉菜单 */}
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
                <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-all duration-200 border border-transparent hover:border-gray-200 focus:outline-none">
                  <Avatar 
                    src={userAvatar ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${userAvatar}` : undefined}
                    icon={!userAvatar ? <UserOutlined /> : undefined}
                    size="default"
                    className={!userAvatar ? "bg-gradient-to-br from-blue-500 to-purple-600" : ""}
                  />
                  <div className="flex flex-col">
                    <span className="text-gray-800 text-sm font-medium leading-tight">{userName}</span>
                    <span className="text-gray-500 text-xs leading-tight">{userRole}</span>
                  </div>
                  <span className="text-gray-400 text-xs">▼</span>
                </div>
              </Dropdown>
            </div>
          </div>
          
          {/* 导航标签页（已临时禁用） */}
          {/**
          <div className="mt-2 border-b border-gray-100">
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              type="editable-card"
              hideAdd
              items={tabs}
              onEdit={(targetKey, action) => {
                if (typeof targetKey === 'string') handleTabEdit(targetKey, action);
              }}
              className="custom-tabs"
            />
          </div>
          */}
        </header>

        {/* 主内容区域 */}
        <main className="flex-1 p-6 pt-[90px]" style={{ backgroundColor: isDark ? '#0b1220' : '#f7f8fa', paddingLeft: '1.1rem', paddingRight: '1.1rem' }}>
          <div className="rounded-lg shadow-sm mx-auto" style={{minHeight: 'calc(100vh - 200px)', backgroundColor: isDark ? '#111827' : '#ffffff' }}>
            <div className="p-8">
              <Outlet />
            </div>
          </div>
          <footer className="w-full text-center text-gray-400 text-sm py-4 select-none">
            © {appConfig.company.copyrightYear} {appConfig.company.name} 版权所有
          </footer>
        </main>
      </div>
    </div>
    </ConfigProvider>
  );
}
