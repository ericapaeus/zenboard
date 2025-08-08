import Sidebar from "./Sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumb, Tabs, Avatar, Dropdown, Space } from "antd";
import { UserOutlined, SettingOutlined, LogoutOutlined, TranslationOutlined, FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";
import { useState, useCallback, useEffect } from "react";
import { routes } from '../routes';
import type { RouteConfig } from '../routes';

function findRouteByPath(path: string, routes: RouteConfig[]): RouteConfig | undefined {
  for (const route of routes) {
    if (route.path === path) return route;
    if (route.children) {
      const found = findRouteByPath(path, route.children);
      if (found) return found;
    }
  }
  return undefined;
}

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const items = [{ title: '首页' }];
  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const route = findRouteByPath(currentPath, routes);
    if (route) {
      items.push({ title: route.label });
    }
  }
  return items;
}

// 新增：根据 path 动态获取标签页 label
function getTabLabelByPath(path: string): string {
  const route = findRouteByPath(path, routes);
  return route ? route.label : '未知页面';
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 动态标签页
  const [tabs, setTabs] = useState([
    { key: "/", label: "控制台", closable: false }
  ]);
  const [activeTab, setActiveTab] = useState("/");

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

  // 侧边栏菜单点击，动态添加标签页
  const handleMenuClick = useCallback((key: string) => {
    setTabs((prevTabs) => {
      if (prevTabs.find((tab) => tab.key === key)) return prevTabs;
      return [
        ...prevTabs,
        { key, label: getTabLabelByPath(key), closable: key !== "/" }
      ];
    });
    setActiveTab(key);
    navigate(key);
  }, [navigate]);

  // 标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    navigate(key);
  };

  // 标签页关闭
  const handleTabEdit = (targetKey: string, action: "remove" | "add") => {
    if (action === "remove") {
      setTabs((prevTabs) => {
        const filtered = prevTabs.filter((tab) => tab.key !== targetKey);
        // 关闭当前激活页时，切换到最后一个标签
        if (activeTab === targetKey && filtered.length > 0) {
          const lastTab = filtered[filtered.length - 1];
          setActiveTab(lastTab.key);
          navigate(lastTab.key);
        }
        return filtered;
      });
    }
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人资料",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "系统设置",
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
      navigate("/settings/profile");
    } else if (key === "settings") {
      navigate("/settings/system");
    }
  };

  // 操作菜单点击事件
  const handleActionMenuClick = ({ key }: { key: string }) => {
    if (key === "fullscreen") {
      toggleFullscreen();
    }
  };

  return (
    <div className="flex h-screen font-sans bg-gray-50 text-[#1D2129] overflow-x-hidden">
      <Sidebar onMenuClick={handleMenuClick} />
      <div className="flex-1 ml-64 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="fixed top-0 left-64 right-0 z-20 bg-white shadow-sm border-b px-6 py-2">
          <div className="flex items-center justify-between">
            {/* 左侧面包屑 */}
            <div className="flex-1">
              <Breadcrumb items={getBreadcrumbItems(location.pathname)} />
            </div>
            
            {/* 右侧用户信息和操作 */}
            <div className="flex items-center space-x-4">
              {/* 操作按钮 */}
              <Space>
                <Dropdown menu={{ items: actionMenuItems, onClick: handleActionMenuClick }} placement="bottomRight">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <TranslationOutlined className="text-gray-600" />
                  </button>
                </Dropdown>
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullscreen ? "退出全屏" : "进入全屏"}
                >
                  {isFullscreen ? (
                    <FullscreenExitOutlined className="text-gray-600" />
                  ) : (
                    <FullscreenOutlined className="text-gray-600" />
                  )}
                </button>
              </Space>
              
              {/* 用户头像和下拉菜单 */}
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                  <Avatar icon={<UserOutlined />} size="small" />
                  <span className="text-gray-700">管理员</span>
                  <span className="text-gray-400">▼</span>
                </div>
              </Dropdown>
            </div>
          </div>
          
          {/* 导航标签页 */}
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
        </header>

        {/* 主内容区域 */}
        <main className="flex-1 bg-[#f7f8fa] p-6 pt-[130px]">
          <div className="bg-white rounded-lg shadow-sm mx-auto" style={{minHeight: 'calc(100vh - 200px)' }}>
            <div className="p-8">
              <Outlet />
            </div>
          </div>
          <footer className="w-full text-center text-gray-400 text-sm py-4 select-none">
            © 2025 万店盈利公司 版权所有
          </footer>
        </main>
      </div>
    </div>
  );
}
