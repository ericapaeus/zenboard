import React from 'react';
import { Row, Col, Card, Typography, List, Space, Badge, Avatar, Button, Modal, Form, Input, Select } from 'antd';
import { CheckCircleTwoTone, NotificationTwoTone, FileTextOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import Task from '@/pages/Task';
import { createPortal } from 'react-dom';

const { Text } = Typography;

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

  // 静态消息数据
  const messages: MessageItem[] = [
    { id: 201, type: 'task', title: '任务 #532 指派给你：修复二维码过期提示', content: '优先级：中，截止 08-14', time: '2025-08-13 09:20', unread: true },
    { id: 202, type: 'document', title: '新文档：项目立项说明', content: '由 王小明 创建', time: '2025-08-12 18:05', unread: true },
    { id: 203, type: 'announcement', title: '今晚 22:00-23:00 系统维护', content: '请提前保存你的工作', time: '2025-08-12 10:10' },
    { id: 204, type: 'task', title: '任务 #528 状态更新为已完成', content: '由 李雷 完成', time: '2025-08-11 16:21' },
    { id: 205, type: 'document', title: '文档已更新：接口对接说明', content: '由 韩梅梅 更新', time: '2025-08-11 14:02' },
  ];

  const renderMessageItem = (m: MessageItem) => {
    const icon = m.type === 'task' ? <CheckCircleTwoTone twoToneColor="#52c41a" />
      : m.type === 'document' ? <FileTextOutlined style={{ color: '#1677ff' }} />
      : <NotificationTwoTone twoToneColor="#faad14" />;

    return (
      <List.Item>
        <List.Item.Meta
          avatar={
            <Badge dot={!!m.unread}>
              <Avatar style={{ background: '#f0f5ff' }} icon={icon} />
            </Badge>
          }
          title={<Text strong>{m.title}</Text>}
          description={
            <Space direction="vertical" size={2}>
              {m.content && <Text type="secondary">{m.content}</Text>}
              <Text type="secondary" style={{ fontSize: 12 }}>{m.time}</Text>
            </Space>
          }
        />
      </List.Item>
    );
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
          <Card title="消息中心" className="shadow-sm h-full" bodyStyle={{ paddingTop: 12 }}>
            <List
              itemLayout="horizontal"
              dataSource={messages}
              renderItem={renderMessageItem}
              locale={{ emptyText: '暂无消息' }}
            />
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
