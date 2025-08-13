import React, { useState } from 'react';
import { Row, Col, Card, Typography, List, Space, Badge, Avatar, Button, Modal, Form, Input, Select, Tag, Skeleton, Tooltip, Divider, message, Tabs, Progress, Pagination, DatePicker } from 'antd';
import { CheckCircleTwoTone, NotificationTwoTone, FileTextOutlined, SearchOutlined, PlusOutlined, FilterOutlined, ReloadOutlined, ClockCircleFilled, CheckCircleFilled, UserOutlined, CalendarOutlined, ClockCircleOutlined, EditOutlined, SendOutlined, DownOutlined, RightOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { messageApi } from '@/services/api';
import type { UserNotification } from '@/types';
import dayjs from 'dayjs';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 将时间 +8 小时后格式化展示（适配服务器 UTC 时间）
const formatPlus8 = (timeStr: string) => {
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return timeStr;
  return new Date(d.getTime() + 8 * 60 * 60 * 1000).toLocaleString('zh-CN');
};

// 任务相关接口
interface Task {
  id: string;
  title: string;
  content: string;
  currentAssignee: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'completed';
  progress: number;
  project?: string;
  priority: 'low' | 'medium' | 'high';
  subtasks: {
    id: string;
    title: string;
    content: string;
    assignee: string;
  }[];
  flowHistory: {
    id: string;
    fromUser: string;
    toUser: string;
    action: 'transfer' | 'complete';
    notes: string;
    timestamp: string;
  }[];
  createdBy: string;
  createdAt: string;
}

export default function Dashboard() {
  // 搜索弹窗
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [searchForm] = Form.useForm();
  const [searchLoading, setSearchLoading] = React.useState(false);

  // 任务管理状态
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // 新增：折叠状态管理
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // 新增：折叠/展开处理函数
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // 新增：检查任务是否展开
  const isTaskExpanded = (taskId: string) => expandedTasks.has(taskId);

  // Mock 任务数据
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '完成项目报告',
      content: '撰写并提交本月的项目进度报告，包括已完成的工作、遇到的问题、解决方案和下一步计划。',
      currentAssignee: '张三',
      startDate: '2024-01-15',
      endDate: '2024-01-25',
      status: 'pending',
      progress: 65,
      project: 'ZenBoard 后端开发',
      priority: 'high',
      subtasks: [
        {
          id: 's1',
          title: '收集数据',
          content: '收集各部门的项目数据',
          assignee: '张三',
        },
        {
          id: 's2',
          title: '撰写初稿',
          content: '根据收集的数据撰写报告初稿',
          assignee: '张三',
        },
      ],
      flowHistory: [
        {
          id: 'f1',
          fromUser: '李四',
          toUser: '张三',
          action: 'transfer',
          notes: '需要技术细节补充',
          timestamp: '2024-01-20 10:30:00'
        }
      ],
      createdBy: '王五',
      createdAt: '2024-01-15 09:00:00'
    },
    {
      id: '2',
      title: '安排团队会议',
      content: '与团队成员协调时间，安排下周的团队例会。会议议程包括：项目进展汇报、问题讨论、下阶段任务分配。',
      currentAssignee: '李四',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      status: 'pending',
      progress: 0,
      project: 'ZenBoard 前端优化',
      priority: 'medium',
      subtasks: [],
      flowHistory: [],
      createdBy: '李四',
      createdAt: '2024-01-20 14:00:00'
    },
    {
      id: '3',
      title: '审查代码',
      content: '审查最新提交的模块代码，确保代码质量、符合编码规范、无潜在bug，并提供详细的代码审查报告。',
      currentAssignee: '王五',
      startDate: '2024-01-10',
      endDate: '2024-01-15',
      status: 'completed',
      progress: 100,
      project: 'ZenBoard 数据库优化',
      priority: 'high',
      subtasks: [
        {
          id: 's4',
          title: '模块A代码审查',
          content: '审查用户认证模块代码',
          assignee: '王五',
        },
      ],
      flowHistory: [
        {
          id: 'f2',
          fromUser: '王五',
          toUser: '王五',
          action: 'complete',
          notes: '代码审查完成，质量良好',
          timestamp: '2024-01-15 16:00:00'
        }
      ],
      createdBy: '王五',
      createdAt: '2024-01-10 10:00:00'
    },
  ]);

  // Mock 用户和项目数据
  const mockUsers = ['张三', '李四', '王五', '赵六', '孙七'];
  const mockProjects = ['ZenBoard 后端开发', 'ZenBoard 前端优化', 'ZenBoard 数据库优化', 'ZenBoard UI/UX 设计'];

  // 获取优先级标签
  const getPriorityTag = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return <Tag color="green">低</Tag>;
      case 'medium':
        return <Tag color="orange">中</Tag>;
      case 'high':
        return <Tag color="red">高</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 根据状态过滤任务 - 移除状态过滤，返回所有任务
  const getTasksByStatus = (status: any) => {
    return tasks; // 返回所有任务，不再按状态过滤
  };

  // 获取当前标签页任务
  const getCurrentTabTasks = () => {
    // 移除状态过滤，返回所有任务
    return tasks;
  };

  const currentTabTasks = getCurrentTabTasks();
  const paginatedTasks = currentTabTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 创建任务
  const handleCreateTask = async (values: any) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: values.title,
      content: values.content,
      currentAssignee: values.assignee,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : '',
      progress: 0,
      project: values.project,
      priority: values.priority,
      subtasks: values.subtasks || [],
      flowHistory: [],
      createdBy: '当前用户',
      createdAt: new Date().toISOString(),
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    message.success('任务创建成功！');
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  // 编辑任务
  const handleEditTask = async (values: any) => {
    if (selectedTask) {
      // 处理日期格式
      const processedValues = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : values.startDate,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : values.endDate,
      };
      
      const updatedTasks = tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, ...processedValues }
          : task
      );
      setTasks(updatedTasks);
      message.success('任务更新成功！');
      setIsEditModalVisible(false);
      setSelectedTask(null);
      editForm.resetFields();
    }
  };

  // 打开编辑弹窗
  const handleEditModalOpen = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalVisible(true);
    
    // 将字符串日期转换为 dayjs 对象，以便 DatePicker 能正确显示
    const formValues = {
      ...task,
      startDate: task.startDate ? dayjs(task.startDate) : null,
      endDate: task.endDate ? dayjs(task.endDate) : null,
    };
    
    editForm.setFieldsValue(formValues);
  };

  // 关闭编辑弹窗
  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setSelectedTask(null);
    editForm.resetFields();
  };

  // 关闭创建弹窗
  const handleCreateModalCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  // 搜索功能
  const handleSearch = async (values: any) => {
    setSearchLoading(true);
    try {
      console.log('搜索参数:', values);
      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSearchVisible(false);
      // 这里可以实现实际的搜索逻辑
    } finally {
      setSearchLoading(false);
    }
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      message.error('全部已读失败，请稍后重试');
    }
  };

  // 渲染任务卡片
  const renderTaskCard = (task: Task) => (
    <Col xs={24} key={task.id}>
      <Card
        hoverable
        className="h-full shadow-sm"
        style={{ borderTop: `4px solid ${task.priority === 'high' ? '#ff4d4f' : task.priority === 'medium' ? '#faad14' : '#52c41a'}` }}
      >
        <div className="mb-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 flex-1">
              <Button
                type="text"
                size="small"
                className="task-expand-button"
                icon={
                  isTaskExpanded(task.id) ? 
                  <DownOutlined className="expand-button expanded" /> : 
                  <RightOutlined className="expand-button" />
                }
                onClick={() => toggleTaskExpansion(task.id)}
                style={{ 
                  padding: '4px', 
                  minWidth: 'auto',
                  color: '#1890ff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px'
                }}
                title={isTaskExpanded(task.id) ? '收起详情' : '展开详情'}
              />
              <Title level={4} className="m-0">{task.title}</Title>
              <Text type="secondary" className="text-xs ml-2">
                {isTaskExpanded(task.id) ? '点击收起' : '点击展开详情'}
              </Text>
            </div>
            <Space>
              {getPriorityTag(task.priority)}
            </Space>
          </div>
          
          <Paragraph className="text-gray-600 mb-3">
            {task.content}
          </Paragraph>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <div className="flex items-center gap-2">
                <UserOutlined className="text-gray-400" />
                <Text type="secondary">当前处理人: {task.currentAssignee}</Text>
              </div>
            </Col>
            
            <Col xs={24} sm={8}>
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-gray-400" />
                <Text type="secondary">
                  {formatDate(task.startDate)} - {formatDate(task.endDate)}
                </Text>
              </div>
            </Col>

            <Col xs={24} sm={8}>
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-gray-400" />
                <Text type="secondary">项目: {task.project || '未指定'}</Text>
              </div>
            </Col>
          </Row>

          <Divider className="my-3" />

          <Row gutter={16} align="middle">
            <Col xs={24} sm={16}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Text strong>完成进度</Text>
                  <Text type="secondary">{task.progress}%</Text>
                </div>
                <Progress 
                  percent={task.progress} 
                  size="small"
                  strokeColor="#1890ff"
                />
              </div>
            </Col>
            
            <Col xs={24} sm={8}>
              {task.subtasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-gray-400" />
                  <Text type="secondary">子任务: {task.subtasks.length} 个</Text>
                </div>
              )}
            </Col>
          </Row>

          {task.flowHistory.length > 0 && (
            <div className="mt-3">
              <Text type="secondary" className="text-xs">
                流转次数: {task.flowHistory.length} 次
              </Text>
            </div>
          )}
        </div>
        
        {/* 展开的详细信息 - 条件渲染 */}
        {isTaskExpanded(task.id) && (
          <div className="expanded-content">
            <Divider style={{ margin: '16px 0' }} />
            
            {/* 展开内容标题 */}
            <div className="mb-4">
              <Title level={5} style={{ color: '#1890ff', margin: 0 }}>
                📋 任务详细信息
              </Title>
            </div>
            
            {/* 子任务列表 */}
            {task.subtasks.length > 0 && (
              <div className="mb-6">
                <Title level={5} className="mb-3">子任务列表</Title>
                <List
                  size="small"
                  bordered
                  dataSource={task.subtasks}
                  renderItem={subtask => (
                    <List.Item>
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-1">
                          <Text strong>{subtask.title}</Text>
                          {subtask.assignee && <Tag color="blue">{subtask.assignee}</Tag>}
                        </div>
                        <Text type="secondary" className="block">{subtask.content}</Text>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 完成情况记录 */}
            <div className="mb-6">
              <Title level={5} className="mb-3">完成情况记录</Title>
              {task.flowHistory.length > 0 ? (
                <List
                  size="small"
                  bordered
                  dataSource={task.flowHistory}
                  renderItem={flow => (
                    <List.Item>
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar size="small" icon={<UserOutlined />} />
                            <Text strong>
                              {flow.fromUser} → {flow.toUser}
                            </Text>
                          </div>
                          <div className="text-right">
                            <Text type="secondary" className="text-xs block">
                              {formatDateTime(flow.timestamp)}
                            </Text>
                            <Tag color={flow.action === 'transfer' ? 'blue' : 'green'}>
                              {flow.action === 'transfer' ? '转交任务' : '完成任务'}
                            </Tag>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <Text className="block">{flow.notes}</Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂无完成情况记录
                </div>
              )}
            </div>

            {/* 任务流转时间线 */}
            <div>
              <Title level={5} className="mb-3">任务流转时间线</Title>
              <div className="flow-timeline">
                <div className="timeline-item">
                  <div className="timeline-dot timeline-dot-start">
                    <CheckCircleOutlined />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <Text strong>任务创建</Text>
                      <Text type="secondary" className="text-xs ml-2">
                        {formatDateTime(task.createdAt)}
                      </Text>
                    </div>
                    <Text type="secondary">创建人: {task.createdBy}</Text>
                    <Text type="secondary" className="block">初始处理人: {task.currentAssignee}</Text>
                  </div>
                </div>

                {task.flowHistory.map((flow) => (
                  <div key={flow.id} className="timeline-item">
                    <div className={`timeline-dot ${flow.action === 'complete' ? 'timeline-dot-end' : 'timeline-dot-transfer'}`}>
                      {flow.action === 'complete' ? <CheckCircleOutlined /> : <SendOutlined />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <Text strong>
                          {flow.action === 'transfer' ? '任务转交' : '任务完成'}
                        </Text>
                        <Text type="secondary" className="text-xs ml-2">
                          {formatDateTime(flow.timestamp)}
                        </Text>
                      </div>
                      <Text type="secondary">
                        从 {flow.fromUser} {flow.action === 'transfer' ? '转交给' : '完成于'} {flow.toUser}
                      </Text>
                      <div className="bg-blue-50 p-2 rounded mt-2">
                        <Text className="text-sm">{flow.notes}</Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 - 放在任务卡片底部 */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Space>
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => message.info('处理任务功能')}
            >
              处理任务
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditModalOpen(task)}
            >
              编辑
            </Button>
          </Space>
        </div>
      </Card>
    </Col>
  );

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
          {/* 任务标签页 */}
          <Card className="mb-6 shadow-sm dashboard-tabs-card">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarExtraContent={
                <div className="actions-bar">
                  <Tooltip title="筛选任务" placement="top">
                    <Button 
                      className="filter-button"
                      icon={<FilterOutlined />}
                      onClick={() => setSearchVisible(true)}
                      shape="circle"
                    />
                  </Tooltip>
                  
                  <Tooltip title="添加新任务" placement="top">
                    <Button 
                      type="primary" 
                      className="add-button"
                      icon={<PlusOutlined />} 
                      onClick={() => setIsCreateModalVisible(true)}
                      shape="circle"
                    />
                  </Tooltip>
          </div>
              }
              items={[
                {
                  key: 'pending',
                  label: (
                    <span>
                      <ClockCircleFilled />
                      待办任务 ({getTasksByStatus('pending').length})
                    </span>
                  ),
                },
                {
                  key: 'completed',
                  label: (
                    <span>
                      <CheckCircleFilled />
                      已办任务 ({getTasksByStatus('completed').length})
                    </span>
                  ),
                },
              ]}
            />
          </Card>

          {/* 任务列表 */}
          <Row gutter={[16, 16]}>
            {paginatedTasks.map(renderTaskCard)}
          </Row>

          {/* 分页组件 */}
          {currentTabTasks.length > 0 && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={currentPage}
                total={currentTabTasks.length}
                pageSize={pageSize}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                onShowSizeChange={(current, size) => {
                  setCurrentPage(1);
                  setPageSize(size);
                }}
              />
            </div>
          )}

          {/* 空状态显示 */}
          {currentTabTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                {searchForm.getFieldValue('keyword') || searchForm.getFieldValue('member') ? '没有找到匹配的任务' : `暂无${activeTab === 'pending' ? '待办' : '已办'}任务`}
              </div>
              <div className="text-gray-400 text-sm">
                {searchForm.getFieldValue('keyword') || searchForm.getFieldValue('member') ? '请尝试调整搜索关键词' : '点击右上角按钮添加'}
              </div>
            </div>
          )}
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
        open={isCreateModalVisible}
        onCancel={handleCreateModalCancel}
        footer={null}
        width={800}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题！' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="任务内容"
            rules={[{ required: true, message: '请输入任务内容！' }]}
          >
            <TextArea rows={4} placeholder="请输入详细的任务内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignee"
                label="初始处理人"
                rules={[{ required: true, message: '请选择初始处理人！' }]}
              >
                <Select placeholder="选择初始处理人">
                  {mockUsers.map(user => (
                    <Option key={user} value={user}>{user}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级！' }]}
              >
                <Select placeholder="选择优先级">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间！' }]}
              >
                <DatePicker 
                  showTime={false}
                  format="YYYY-MM-DD"
                  placeholder="选择开始时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间！' }]}
              >
                <DatePicker 
                  showTime={false}
                  format="YYYY-MM-DD"
                  placeholder="选择结束时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="project"
            label="所属项目"
          >
            <Select placeholder="选择所属项目（可选）">
              {mockProjects.map(project => (
                <Option key={project} value={project}>{project}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* 子任务管理 */}
          <Form.Item label="子任务">
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <Text strong>子任务列表</Text>
            <Button 
                  type="dashed" 
                  size="small" 
              icon={<PlusOutlined />} 
                  onClick={() => {
                    const currentSubtasks = createForm.getFieldValue('subtasks') || [];
                    createForm.setFieldsValue({
                      subtasks: [...currentSubtasks, { id: `temp_${Date.now()}`, title: '', content: '', assignee: '' }]
                    });
                  }}
                >
                  添加子任务
                </Button>
              </div>
              
              <Form.List name="subtasks">
                {(fields, { remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="border rounded p-3 mb-2 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <Text strong>子任务 {name + 1}</Text>
                          <Button 
                            type="text" 
                            danger 
                            size="small" 
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          />
                        </div>
                        
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'title']}
                              rules={[{ required: true, message: '请输入子任务标题！' }]}
                            >
                              <Input placeholder="子任务标题" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'assignee']}
                              label="处理人"
                              rules={[{ required: true, message: '请选择子任务处理人！' }]}
                            >
                              <Select placeholder="选择处理人">
                                {mockUsers.map(user => (
                                  <Option key={user} value={user}>{user}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'content']}
                              rules={[{ required: true, message: '请输入子任务内容！' }]}
                            >
                              <TextArea rows={2} placeholder="子任务内容" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ))}
                    
                    {fields.length === 0 && (
                      <div className="text-center text-gray-400 py-4">
                        暂无子任务，点击上方按钮添加
                      </div>
                    )}
                  </>
                )}
              </Form.List>
            </div>
          </Form.Item>

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
        open={isEditModalVisible}
        onCancel={handleEditModalCancel}
        footer={null}
        width={800}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditTask}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题！' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="任务内容"
            rules={[{ required: true, message: '请输入任务内容！' }]}
          >
            <TextArea rows={4} placeholder="请输入详细的任务内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="currentAssignee"
                label="当前处理人"
                rules={[{ required: true, message: '请选择当前处理人！' }]}
              >
                <Select placeholder="选择当前处理人">
                  {mockUsers.map(user => (
                    <Option key={user} value={user}>{user}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级！' }]}
              >
                <Select placeholder="选择优先级">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间！' }]}
              >
                <DatePicker 
                  showTime={false}
                  format="YYYY-MM-DD"
                  placeholder="选择开始时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间！' }]}
              >
                <DatePicker 
                  showTime={false}
                  format="YYYY-MM-DD"
                  placeholder="选择结束时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="project"
            label="所属项目"
          >
            <Select placeholder="选择所属项目（可选）">
              {mockProjects.map(project => (
                <Option key={project} value={project}>{project}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* 子任务管理 */}
          <Form.Item label="子任务">
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <Text strong>子任务列表</Text>
                <Button 
                  type="dashed" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const currentSubtasks = editForm.getFieldValue('subtasks') || [];
                    editForm.setFieldsValue({
                      subtasks: [...currentSubtasks, { id: `temp_${Date.now()}`, title: '', content: '', assignee: '' }]
                    });
                  }}
                >
                  添加子任务
                </Button>
              </div>
              
              <Form.List name="subtasks">
                {(fields, { remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="border rounded p-3 mb-3 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <Text strong>子任务 {name + 1}</Text>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            删除
                          </Button>
                        </div>
                        
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'title']}
                              rules={[{ required: true, message: '请输入子任务标题！' }]}
                            >
                              <Input placeholder="子任务标题" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'assignee']}
                              label="处理人"
                              rules={[{ required: true, message: '请选择子任务处理人！' }]}
                            >
                              <Select placeholder="选择处理人">
                                {mockUsers.map(user => (
                                  <Option key={user} value={user}>{user}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'content']}
                              rules={[{ required: true, message: '请输入子任务内容！' }]}
                            >
                              <TextArea rows={2} placeholder="子任务内容" />
                          </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            </div>
          </Form.Item>

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
        confirmLoading={searchLoading}
        className="search-modal"
        width={500}
        okText="搜索"
        cancelText="取消"
        footer={[
          <Button key="reset" onClick={handleReset} disabled={searchLoading}>
            重置
          </Button>,
          <Button key="cancel" onClick={() => setSearchVisible(false)} disabled={searchLoading}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={searchLoading}
            onClick={() => searchForm.submit()}
          >
            搜索
          </Button>,
        ]}
      >
        <Form 
          form={searchForm} 
          layout="vertical" 
          onFinish={handleSearch}
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
