import React from 'react';
import { Row, Col, Card, Typography, List, Space, Badge, Avatar, Button, Modal, Form, Input, Select, Tag, Skeleton, message } from 'antd';
import { CheckCircleTwoTone, NotificationTwoTone, FileTextOutlined, SearchOutlined,  ReloadOutlined } from '@ant-design/icons';
import { messageApi } from '@/services/api';
import type { UserNotification } from '@/types';

const { Text } = Typography;

// 动态导入Task组件
const TaskComponent = React.lazy(() => import('./Task'));

// 将时间 +8 小时后格式化展示（适配服务器 UTC 时间）
const formatPlus8 = (timeStr: string) => {
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return timeStr;
  return new Date(d.getTime() + 8 * 60 * 60 * 1000).toLocaleString('zh-CN');
};

export default function Dashboard() {
  // 搜索弹窗
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [searchForm] = Form.useForm();

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
    } catch {
      message.error('消息加载失败，请稍后重试');
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
    try {
      const res = await messageApi.markRead(m.id);
      if (res.success) {
        fetchMessages();
      } else {
        message.error('标记已读失败');
      }
    } catch {
      message.error('标记已读失败，请稍后重试');
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await messageApi.markAllRead();
      if (res.success) {
        message.success('已将全部消息标记为已读');
        fetchMessages();
      } else {
        message.error('全部已读操作失败');
      }
    } catch {
      message.error('全部已读失败，请稍后重试');
    }
  };

  return (
    <div className="p-6">
      {/* 样式定义 */}
      <style>{`
        .dashboard-tabs-card {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        
        .actions-bar { 
          display: flex; 
          align-items: center; 
          gap: 4px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 8px 12px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(8px);
        }
        
        .actions-bar:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
          transform: translateY(-2px);
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        
        .filter-button {
          border-radius: 50%;
          width: 32px;
          height: 32px;
          border: 1px solid #d1d5db;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          color: #6b7280;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .filter-button:hover {
          border-color: #60a5fa;
          color: #2563eb;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
        }
        
        .add-button {
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .add-button:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        }
        
        .add-button:active {
          transform: translateY(0) scale(1);
        }
        
        .add-button .anticon {
          color: #ffffff;
        }
        
        .add-button:hover .anticon {
          transform: scale(1.15) rotate(90deg);
        }
        
        /* 搜索弹窗样式优化 */
        .search-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .search-modal .ant-modal-header {
          display: none;
        }
        
        .search-modal .ant-modal-body {
          padding: 24px;
          padding-top: 24px;
        }
        
        .search-modal .ant-form-item-label > label {
          font-weight: 500;
          color: #374151;
        }
        
        .search-modal .ant-input,
        .search-modal .ant-select-selector {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          transition: all 0.3s ease;
        }
        
        .search-modal .ant-input:focus,
        .search-modal .ant-select-focused .ant-select-selector {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .search-modal .ant-btn {
          border-radius: 8px;
          height: 40px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .search-modal .ant-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        
        .search-modal .ant-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }
        
        /* 任务卡片展开/收起样式 */
        .task-expand-button {
          transition: transform 0.3s ease;
        }
        .expand-button {
          transition: transform 0.3s ease;
        }
        .expand-button.expanded {
          transform: rotate(90deg);
        }

        .expanded-content {
          animation: slideDown 0.3s ease-out;
          overflow: hidden;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 1000px;
            transform: translateY(0);
          }
        }

        /* 任务时间线样式 */
        .flow-timeline {
          position: relative;
          padding-left: 20px;
        }
        
        .flow-timeline::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e8e8e8;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 20px;
          padding-left: 30px;
        }
        
        .timeline-dot {
          position: absolute;
          left: -15px;
          top: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          z-index: 1;
        }
        
        .timeline-dot-start {
          background: #52c41a;
        }
        
        .timeline-dot-transfer {
          background: #1890ff;
        }
        
        .timeline-dot-end {
          background: #52c41a;
        }
        
        .timeline-content {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #f0f0f0;
        }
        
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
      `}</style>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* 直接使用Task组件替换整个任务管理区域 */}
          <React.Suspense fallback={<div>加载中...</div>}>
            <TaskComponent />
          </React.Suspense>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                消息中心
                {unreadCount > 0 && <Tag color="red">未读 {unreadCount}</Tag>}
              </Space>
            } 
            extra={
              <Button 
                size="small" 
                onClick={markAllAsRead}
                icon={<ReloadOutlined />}
                type="text"
                className="hover:bg-blue-50"
              >
                全部已读
              </Button>
            } 
            className="shadow-sm h-full" 
            bodyStyle={{ paddingTop: 12 }}
          >
            {loadingMessages ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <List
                rowKey="id"
                itemLayout="horizontal"
                dataSource={messages}
                renderItem={renderMessageItem}
                locale={{ emptyText: '暂无消息' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 创建任务弹窗 */}
      <Modal
        title="添加新任务"
        open={false} // This modal is no longer used for creating tasks
        onCancel={() => {}}
        footer={null}
        width={800}
      >
        <Form
          // createForm is removed
          layout="vertical"
          // handleCreateTask is removed
        >
          {/* The form items for creating a task are removed */}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加任务
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑任务弹窗 */}
      <Modal
        title="编辑任务"
        open={false} // This modal is no longer used for editing tasks
        onCancel={() => {}}
        footer={null}
        width={800}
      >
        <Form
          // editForm is removed
          layout="vertical"
          // handleEditTask is removed
        >
          {/* The form items for editing a task are removed */}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 搜索弹窗 */}
      <Modal
        open={searchVisible}
        onCancel={() => setSearchVisible(false)}
        onOk={() => searchForm.submit()}
        confirmLoading={false}
        className="search-modal"
        width={500}
        okText="搜索"
        cancelText="取消"
        footer={[
          <Button key="reset" onClick={() => searchForm.resetFields()} disabled={false}>
            重置
          </Button>,
          <Button key="cancel" onClick={() => setSearchVisible(false)} disabled={false}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={false}
            onClick={() => searchForm.submit()}
          >
            搜索
          </Button>,
        ]}
      >
        <Form 
          form={searchForm} 
          layout="vertical" 
          // handleSearch is removed
          style={{ marginTop: 0 }}
        >
          <Form.Item name="keyword" label="关键词搜索">
            <Input 
              placeholder="搜索任务标题、内容、处理人或项目" 
              allowClear 
              size="large"
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            />
          </Form.Item>
          
          <Form.Item name="member" label="处理人">
            <Select
              placeholder="选择处理人"
              allowClear
              size="large"
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
          
          <Form.Item name="priority" label="优先级">
            <Select
              placeholder="选择优先级"
              allowClear
              size="large"
              options={[
                { label: '全部优先级', value: 'all' },
                { label: '高', value: 'high' },
                { label: '中', value: 'medium' },
                { label: '低', value: 'low' },
              ]}
            />
          </Form.Item>
          
          <Form.Item name="status" label="任务状态">
            <Select
              placeholder="选择任务状态"
              allowClear
              size="large"
              options={[
                { label: '全部状态', value: 'all' },
                { label: '待处理', value: 'pending' },
                { label: '已完成', value: 'completed' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
