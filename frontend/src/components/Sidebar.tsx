import { Link, useLocation } from "react-router-dom";
import { Menu } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  CalendarOutlined,
  MessageOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  BookOutlined
} from '@ant-design/icons';
import "../App.css";
import type { MenuProps } from 'antd';

interface SidebarProps {
  onMenuClick?: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (onMenuClick) onMenuClick(e.key);
  };
  
  return (
    <aside className="w-64 bg-white shadow-lg fixed h-full z-30">
      <div className="p-4 border-b flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <DashboardOutlined className="text-white text-xl" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ZenBoard
        </h1>
      </div>
      <nav className="p-4 flex flex-col h-[calc(100%-80px)] overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={[]}
          style={{ height: "100%", borderRight: 0 }}
          onClick={handleMenuClick}
        >
          {/* 控制台 */}
          <Menu.Item key="/" icon={<DashboardOutlined />}>
            <Link to="/">控制台</Link>
          </Menu.Item>

          {/* 团队管理 */}
          <Menu.SubMenu key="/team" icon={<TeamOutlined />} title="团队管理">
            <Menu.Item key="/team/members" icon={<UserOutlined />}>
              <Link to="/team/members">成员管理</Link>
            </Menu.Item>
            <Menu.Item key="/team/approvals" icon={<UnorderedListOutlined />}>
              <Link to="/team/approvals">审批管理</Link>
            </Menu.Item>
            <Menu.Item key="/team/contracts" icon={<CalendarOutlined />}>
              <Link to="/team/contracts">合同管理</Link>
            </Menu.Item>
          </Menu.SubMenu>

          {/* 项目管理 */}
          <Menu.SubMenu key="/projects" icon={<ProjectOutlined />} title="项目管理">
            <Menu.Item key="/projects/list" icon={<UnorderedListOutlined />}>
              <Link to="/projects/list">项目列表</Link>
            </Menu.Item>
            <Menu.Item key="/projects/create" icon={<PlusOutlined />}>
              <Link to="/projects/create">创建项目</Link>
            </Menu.Item>
            <Menu.Item key="/projects/board" icon={<DashboardOutlined />}>
              <Link to="/projects/board">团队公告板</Link>
            </Menu.Item>
          </Menu.SubMenu>

          {/* 任务管理 */}
          <Menu.SubMenu key="/tasks" icon={<CheckSquareOutlined />} title="任务管理">
            <Menu.Item key="/tasks/my" icon={<UserOutlined />}>
              <Link to="/tasks/my">我的任务</Link>
            </Menu.Item>
            <Menu.Item key="/tasks/assigned" icon={<UnorderedListOutlined />}>
              <Link to="/tasks/assigned">已指派任务</Link>
            </Menu.Item>
            <Menu.Item key="/tasks/private" icon={<BookOutlined />}>
              <Link to="/tasks/private">私有任务</Link>
            </Menu.Item>
          </Menu.SubMenu>

          {/* 日记系统 */}
          <Menu.SubMenu key="/diary" icon={<FileTextOutlined />} title="日记系统">
            <Menu.Item key="/diary/my" icon={<UserOutlined />}>
              <Link to="/diary/my">我的日记</Link>
            </Menu.Item>
            <Menu.Item key="/diary/shared" icon={<UnorderedListOutlined />}>
              <Link to="/diary/shared">共享日记</Link>
            </Menu.Item>
            <Menu.Item key="/diary/create" icon={<PlusOutlined />}>
              <Link to="/diary/create">写日记</Link>
            </Menu.Item>
          </Menu.SubMenu>

          {/* 消息中心 */}
          <Menu.Item key="/messages" icon={<MessageOutlined />}>
            <Link to="/messages">消息中心</Link>
          </Menu.Item>

          {/* 系统设置 */}
          <Menu.SubMenu key="/settings" icon={<SettingOutlined />} title="系统设置">
            <Menu.Item key="/settings/profile" icon={<UserOutlined />}>
              <Link to="/settings/profile">个人资料</Link>
            </Menu.Item>
            <Menu.Item key="/settings/system" icon={<SettingOutlined />}>
              <Link to="/settings/system">系统配置</Link>
            </Menu.Item>
          </Menu.SubMenu>
        </Menu>
      </nav>
    </aside>
  );
};

export default Sidebar; 