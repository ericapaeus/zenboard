import React from 'react';
import { Row, Col, Card, Typography, List, Space, Badge, Avatar, Button, Modal, Form, Input, Select, Tag, Skeleton } from 'antd';
import { CheckCircleTwoTone, NotificationTwoTone, FileTextOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import Task from '@/pages/Task';
import { messageApi } from '@/services/api';
import type { UserNotification } from '@/types';
import { createPortal } from 'react-dom';

const { Text } = Typography;

// 将时间 +8 小时后格式化展示（适配服务器 UTC 时间）
const formatPlus8 = (timeStr: string) => {
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return timeStr;
  return new Date(d.getTime() + 8 * 60 * 60 * 1000).toLocaleString('zh-CN');
};

interface MessageItem {
  id: number;
  type: 'task' | 'document' | 'announcement';
  title: string;
  content?: string;
  time: string; // YYYY-MM-DD HH:mm
  unread?: boolean;
}

export default function Dashboard() {
  // 搜索弹窗
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [searchForm] = Form.useForm();

  // 目标：将自定义按钮渲染到 Task 内 Tabs 的右侧区域
  const [extraContainer, setExtraContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const wrapper = document.querySelector('.dashboard-task-wrapper');
    if (!wrapper) return;

    const findExtra = () => {
      const el = wrapper.querySelector('.ant-tabs-extra-content') as HTMLElement | null;
      if (el) setExtraContainer(el);
    };

    // 初次查找
    findExtra();

    // 监听子树变化，确保在 Task 渲染完成后获取到容器
    const mo = new MutationObserver(() => findExtra());
    mo.observe(wrapper, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  const handleAddClick = () => {
    // 触发 Task 内部已存在的“添加”按钮（位于被隐藏的表单里）
    const wrapper = document.querySelector('.dashboard-task-wrapper');
    const buttons = wrapper?.querySelectorAll<HTMLButtonElement>('.ant-tabs-extra-content button');
    if (buttons && buttons.length) {
      const addBtn = Array.from(buttons).find(b => b.textContent?.trim() === '添加');
      addBtn?.click();
    }
  };

  // 消息中心数据
  const [loadingMessages, setLoadingMessages] = React.useState(true);
  const [messages, setMessages] = React.useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  const fetchMessages = React.useCallback(async () => {
    setLoadingMessages(true);
    try {
      const [listRes, countRes] = await Promise.all([
        messageApi.listMy({ skip: 0, limit: 10 }),
        messageApi.unreadCount(),
      ]);
      if (listRes.success) setMessages(listRes.data || []);
      if (countRes.success) setUnreadCount(countRes.data || 0);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  React.useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const renderMessageItem = (m: UserNotification) => {
    const typeIcon = m.entity_type === 'task' ? <CheckCircleTwoTone twoToneColor="#52c41a" />
      : m.entity_type === 'document' ? <FileTextOutlined style={{ color: '#1677ff' }} />
      : <NotificationTwoTone twoToneColor="#faad14" />;

    const levelColor: Record<string, string> = { info: 'blue', warning: 'orange', error: 'red' };

    return (
      <List.Item onClick={() => markOneAsRead(m)} style={{ cursor: 'pointer' }}>
        <List.Item.Meta
          avatar={
            <Badge dot={!m.read}>
              <Avatar style={{ background: '#f0f5ff' }} icon={typeIcon} />
            </Badge>
          }
          title={<Space><Text strong>{m.title}</Text><Tag color={levelColor[m.level] || 'blue'}>{m.level}</Tag></Space>}
          description={
            <Space direction="vertical" size={2}>
              {m.content && <Text type="secondary">{m.content}</Text>}
              <Text type="secondary" style={{ fontSize: 12 }}>
                {m.actor_name ? <>由 {m.actor_name} <span style={{ margin: '0 4px' }}>•</span></> : null}
                {formatPlus8(m.delivered_at || m.created_at)}
              </Text>
            </Space>
          }
        />
      </List.Item>
    );
  };

  const markOneAsRead = async (m: UserNotification) => {
    if (m.read) return;
    const res = await messageApi.markRead(m.id);
    if (res.success) fetchMessages();
  };

  const markAllAsRead = async () => {
    const res = await messageApi.markAllRead();
    if (res.success) fetchMessages();
  };

  return (
    <div className="p-6">
      {/* 仅隐藏 Task 自带的内联搜索表单，保留右侧区域用于放置自定义按钮；并优化右侧操作区样式 */}
      <style>{`
        .dashboard-task-wrapper .ant-tabs-extra-content form { display: none !important; }
        .dashboard-task-wrapper .ant-tabs-extra-content { display: flex; align-items: center; }
        .dashboard-task-wrapper .ant-tabs-extra-content .actions-bar { display: flex; align-items: center; gap: 8px; }
        .dashboard-task-wrapper .ant-tabs-extra-content .search-trigger { width: 260px; cursor: pointer; }
        @media (max-width: 992px) {
          .dashboard-task-wrapper .ant-tabs-extra-content .search-trigger { width: 200px; }
        }
        @media (max-width: 576px) {
          .dashboard-task-wrapper .ant-tabs-extra-content .search-trigger { display: none; }
        }
      `}</style>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <div className="dashboard-task-wrapper">
            <Task displayMode="full" />
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<Space>消息中心{unreadCount>0 && <Tag color="red">未读 {unreadCount}</Tag>}</Space>} extra={<Button size="small" onClick={markAllAsRead}>全部已读</Button>} className="shadow-sm h-full" bodyStyle={{ paddingTop: 12 }}>
            {loadingMessages ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={messages}
                renderItem={renderMessageItem}
                locale={{ emptyText: '暂无消息' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 将按钮渲染到 Tabs 右侧（更柔和的排版：仿输入框+主按钮） */}
      {extraContainer && createPortal(
        <div className="actions-bar">
          <Input
            className="search-trigger"
            placeholder="搜索任务标题、内容、处理人或项目"
            prefix={<SearchOutlined />}
            readOnly
            onClick={() => setSearchVisible(true)}
          />
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddClick}>
            添加
          </Button>
        </div>,
        extraContainer
      )}

      {/* 搜索弹窗 */}
      <Modal
        title="搜索任务"
        open={searchVisible}
        onCancel={() => setSearchVisible(false)}
        onOk={() => setSearchVisible(false)}
      >
        <Form form={searchForm} layout="vertical">
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="搜索任务标题、内容、处理人或项目" allowClear />
          </Form.Item>
          <Form.Item name="member" label="处理人">
            <Select
              placeholder="选择处理人"
              allowClear
              options={[
                { label: '全部成员', value: 'all' },
                { label: '张三', value: '张三' },
                { label: '李四', value: '李四' },
                { label: '王五', value: '王五' },
                { label: '赵六', value: '赵六' },
                { label: '孙七', value: '孙七' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
