import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";
import { routes } from '../routes';
import type { RouteConfig } from '../routes';
import "../App.css";
import type { MenuProps } from 'antd';

interface SidebarProps {
  onMenuClick?: (key: string) => void;
}

function getOpenKeys(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 1) {
    return [`/${segments[0]}`];
  }
  return [];
}

const renderMenuItems = (routes: RouteConfig[]) =>
  routes.map(route =>
    route.children ? (
      <Menu.SubMenu key={route.path} icon={route.icon} title={route.label}>
        {renderMenuItems(route.children)}
      </Menu.SubMenu>
    ) : (
      <Menu.Item key={route.path} icon={route.icon}>
        <Link to={route.path}>{route.label}</Link>
      </Menu.Item>
    )
  );

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  // 受控 openKeys 状态
  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys(location.pathname));

  // 路由变化时自动展开
  useEffect(() => {
    setOpenKeys(getOpenKeys(location.pathname));
  }, [location.pathname]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (onMenuClick) onMenuClick(e.key);
  };

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <aside className="w-64 bg-white shadow-lg fixed h-full z-30">
      <div className="p-4 border-b flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          {routes[0].icon}
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ZenBoard
        </h1>
      </div>
      <nav className="p-4 flex flex-col h-[calc(100%-80px)] overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          style={{ height: "100%", borderRight: 0 }}
          onClick={handleMenuClick}
        >
          {renderMenuItems(routes)}
        </Menu>
      </nav>
    </aside>
  );
};

export default Sidebar;
