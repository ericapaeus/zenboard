import React, { useState } from 'react';
import { Card, Typography, Tag, Modal, Button, Input, Select, List, Form, message, Popconfirm, Row, Col, Space, Avatar, Progress, Divider, Pagination, Tabs, Transfer, Checkbox, Radio, DatePicker } from 'antd';
import { UserOutlined, InfoCircleOutlined, PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, SearchOutlined, SendOutlined, CheckCircleFilled, ClockCircleFilled, EditFilled, DownOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface Subtask {
  id: string;
  title: string;
  content: string;
  assignee?: string; // 新增处理人字段
  parentId?: string;
  children?: Subtask[];
}

interface TaskFlow {
  id: string;
  fromUser: string;
  toUser: string;
  action: 'transfer' | 'complete';
  notes: string;
  timestamp: string;
}

interface Task {
  id: string;
  title: string;
  content: string;
  currentAssignee: string;
  originalAssignee: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'pending' | 'completed';
  progress: number;
  project?: string;
  priority: 'low' | 'medium' | 'high';
  subtasks: Subtask[];
  completionNotes?: string;
  flowHistory: TaskFlow[];
  createdBy: string;
  createdAt: string;
}

interface TaskProps {
  displayMode?: 'full' | 'pendingOnly';
}

const Task: React.FC<TaskProps> = ({ displayMode = 'full' }) => {
  // 添加样式
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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
      
      .task-list-item {
        transition: all 0.3s ease;
      }
      
      .task-list-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      }
      
      .expand-button {
        transition: transform 0.3s ease;
      }
      
      .expand-button.expanded {
        transform: rotate(90deg);
      }
      
      .expand-button:hover {
        background-color: #f0f8ff;
        border-color: #1890ff;
      }
      
      .task-expand-button {
        transition: all 0.2s ease;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }
      
      .task-expand-button:hover {
        background-color: #f0f8ff;
        transform: scale(1.1);
      }
      
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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 状态管理
  const [activeTab, setActiveTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [subtaskForm] = Form.useForm();
  
  // 模态框状态
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [transferAction, setTransferAction] = useState<'transfer' | 'complete'>('transfer');

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

  // Mock data for tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '完成项目报告',
      content: '撰写并提交本月的项目进度报告，包括已完成的工作、遇到的问题、解决方案和下一步计划。',
      currentAssignee: '张三',
      originalAssignee: '李四',
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
        },
        {
          id: 's2',
          title: '撰写初稿',
          content: '根据收集的数据撰写报告初稿',
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
      originalAssignee: '李四',
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
      originalAssignee: '王五',
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

  // Mock users for assignment
  const mockUsers = ['张三', '李四', '王五', '赵六', '孙七'];
  const mockProjects = ['ZenBoard 后端开发', 'ZenBoard 前端优化', 'ZenBoard 数据库优化', 'ZenBoard UI/UX 设计'];

  const getStatusTag = (status: Task['status']) => {
    switch (status) {
      case 'draft':
        return <Tag color="default" icon={<EditFilled />}>起草中</Tag>;
      case 'pending':
        return <Tag color="processing" icon={<ClockCircleFilled />}>待处理</Tag>;
      case 'completed':
        return <Tag color="success" icon={<CheckCircleFilled />}>已完成</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const showTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalVisible(true);
    setShowAddSubtaskForm(false);
    // setCompletionNotes(task.completionNotes || ''); // This line was removed from the new_code, so it's removed here.
  };

  const handleDetailsModalCancel = () => {
    setIsDetailsModalVisible(false);
    setSelectedTask(null);
    subtaskForm.resetFields();
    setShowAddSubtaskForm(false);
  };

  const handleCreateModalOpen = () => {
    setIsCreateModalVisible(true);
    createForm.resetFields();
    createForm.setFieldsValue({ subtasks: [] });
  };

  const handleCreateModalCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

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

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setSelectedTask(null);
    editForm.resetFields();
  };

  const handleTransferModalOpen = (task: Task) => {
    setSelectedTask(task);
    setIsTransferModalVisible(true);
    transferForm.resetFields();
    setTransferAction('transfer');
  };

  const handleTransferModalCancel = () => {
    setIsTransferModalVisible(false);
    setSelectedTask(null);
    transferForm.resetFields();
  };

  const handleAddSubtask = (values: any) => {
    if (selectedTask) {
      const newSubtask: Subtask = {
        id: `s${Date.now()}`,
        title: values.title,
        content: values.content,
        assignee: values.assignee, // 添加处理人字段
      };
      const updatedTasks = tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, subtasks: [...task.subtasks, newSubtask] }
          : task
      );
      setTasks(updatedTasks);
      setSelectedTask(prev => prev ? { ...prev, subtasks: [...prev.subtasks, newSubtask] } : null);
      subtaskForm.resetFields();
      message.success('子任务添加成功！');
      setShowAddSubtaskForm(false);
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (selectedTask) {
      const updatedTasks = tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, subtasks: task.subtasks.filter(sub => sub.id !== subtaskId) }
          : task
      );
      setTasks(updatedTasks);
      setSelectedTask(prev => prev ? { ...prev, subtasks: prev.subtasks.filter(sub => sub.id !== subtaskId) } : null);
      message.success('子任务删除成功！');
    }
  };

  const handleCreateTask = async (values: any) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: values.title,
      content: values.content,
      currentAssignee: values.assignee,
      originalAssignee: values.assignee,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : '',
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : '',
      status: 'draft',
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
    handleCreateModalCancel();
  };

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
      handleEditModalCancel();
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    message.success('任务删除成功！');
    handleDetailsModalCancel();
  };

  const handleTransferTask = async (values: any) => {
    if (selectedTask) {
      let newFlow: TaskFlow;
      let updatedTask: Task;
      let updatedTasks: Task[];

      if (selectedTask.status === 'draft') {
        // 起草任务派发逻辑
        newFlow = {
          id: `f${Date.now()}`,
          fromUser: selectedTask.currentAssignee,
          toUser: values.toUser,
          action: 'transfer',
          notes: '任务派发',
          timestamp: new Date().toISOString(),
        };

        updatedTask = {
          ...selectedTask,
          currentAssignee: values.toUser,
          status: 'pending',
          flowHistory: [...selectedTask.flowHistory, newFlow],
        };

        updatedTasks = tasks.map(task =>
          task.id === selectedTask.id ? updatedTask : task
        );
        setTasks(updatedTasks);
        message.success('任务已派发！');
        handleTransferModalCancel();
      } else {
        // 待办任务流转逻辑
        newFlow = {
          id: `f${Date.now()}`,
          fromUser: selectedTask.currentAssignee,
          toUser: values.toUser,
          action: transferAction,
          notes: values.notes,
          timestamp: new Date().toISOString(),
        };

        updatedTask = {
          ...selectedTask,
          flowHistory: [...selectedTask.flowHistory, newFlow],
          completionNotes: values.notes,
        };

        if (transferAction === 'complete') {
          updatedTask.status = 'completed';
          updatedTask.progress = 100;
          message.success('任务已完成！');
        } else {
          updatedTask.currentAssignee = values.toUser;
          message.success('任务已转交！');
        }

        updatedTasks = tasks.map(task =>
          task.id === selectedTask.id ? updatedTask : task
        );
        setTasks(updatedTasks);
        handleTransferModalCancel();
      }
    }
  };

  // 搜索和筛选功能
  const handleSearch = (values: any) => {
    let filtered = [...tasks];
    
    // 关键词搜索
    if (values.keyword) {
      const keyword = values.keyword.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(keyword) ||
        task.content.toLowerCase().includes(keyword) ||
        task.currentAssignee.toLowerCase().includes(keyword) ||
        task.project?.toLowerCase().includes(keyword)
      );
    }
    
    // 成员筛选
    if (values.member && values.member !== 'all') {
      filtered = filtered.filter(task => 
        task.currentAssignee === values.member
      );
    }
    
    // setFilteredTasks(filtered); // This line was removed from the new_code, so it's removed here.
    setCurrentPage(1);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    // setFilteredTasks(tasks); // This line was removed from the new_code, so it's removed here.
    setCurrentPage(1);
  };

  // 根据当前标签页过滤任务
  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status); // Changed from filteredTasks to tasks
  };

  // 初始化筛选结果
  React.useEffect(() => {
    // setFilteredTasks(tasks); // This line was removed from the new_code, so it's removed here.
  }, [tasks]);

  // 过滤和分页逻辑
  const getCurrentTabTasks = () => {
    if (displayMode === 'pendingOnly') {
      return getTasksByStatus('pending');
    }
    const statusMap: Record<string, Task['status']> = {
      'pending': 'pending', 
      'completed': 'completed'
    };
    return getTasksByStatus(statusMap[activeTab] || 'pending');
  };

  const currentTabTasks = getCurrentTabTasks();
  const paginatedTasks = currentTabTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(currentTabTasks.length / pageSize);

  const renderTaskCard = (task: Task) => (
    <Col xs={24} key={task.id}>
      <Card
        hoverable
        className="h-full shadow-sm"
        style={{ borderTop: `4px solid ${task.priority === 'high' ? '#ff4d4f' : task.priority === 'medium' ? '#faad14' : '#52c41a'}` }}
        actions={[
          ...(task.status === 'pending' ? [
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => handleTransferModalOpen(task)}
            >
              处理任务
            </Button>
          ] : []),
          ...(task.status === 'draft' ? [
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => handleTransferModalOpen(task)}
            >
              派发任务
            </Button>
          ] : [])
        ]}
      >
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <Title level={4} className="m-0 flex-1 mr-2">{task.title}</Title>
            <Space>
              {getPriorityTag(task.priority)}
              {getStatusTag(task.status)}
            </Space>
          </div>
          
          <Paragraph className="text-gray-600 mb-3" ellipsis={{ rows: 2 }}>
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
                  strokeColor={task.status === 'completed' ? '#52c41a' : task.status === 'pending' ? '#1890ff' : '#d9d9d9'}
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
      </Card>
    </Col>
  );

  const renderExpandableTaskList = () => (
    <List
      className="task-list"
      itemLayout="vertical"
      size="large"
      dataSource={currentTabTasks}
      renderItem={(task) => (
        <List.Item
          key={task.id}
          className="task-list-item"
          style={{ 
            borderTop: `4px solid ${task.priority === 'high' ? '#ff4d4f' : task.priority === 'medium' ? '#faad14' : '#52c41a'}`,
            marginBottom: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '20px'
          }}
          actions={[
            ...(displayMode === 'full' && task.status === 'pending' ? [
              <Button
                type="link"
                icon={<SendOutlined />}
                onClick={() => handleTransferModalOpen(task)}
              >
                处理任务
              </Button>,
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditModalOpen(task)}
              >
                编辑
              </Button>
            ] : []),
            ...(displayMode === 'full' && task.status === 'draft' ? [
              <Button
                type="link"
                icon={<SendOutlined />}
                onClick={() => handleTransferModalOpen(task)}
              >
                派发任务
              </Button>
            ] : []),
            ...(displayMode === 'pendingOnly' && task.status === 'pending' ? [
              <Button
                type="link"
                icon={<SendOutlined />}
                onClick={() => handleTransferModalOpen(task)}
              >
                处理任务
              </Button>,
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditModalOpen(task)}
              >
                编辑
              </Button>
            ] : [])
          ]}
        >
          {/* 任务基本信息 */}
          <div className="task-basic-info mb-4">
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
                {getStatusTag(task.status)}
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
                    strokeColor={task.status === 'completed' ? '#52c41a' : task.status === 'pending' ? '#1890ff' : '#d9d9d9'}
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
                      <Text type="secondary" className="block">初始处理人: {task.originalAssignee}</Text>
                    </div>
                  </div>

                  {task.flowHistory.map((flow, index) => (
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
        </List.Item>
      )}
    />
  );

  return (
    <div className="p-6">
      {displayMode === 'full' && (
        <>
          {/* 搜索区域 */}
          <Card className="mb-6 shadow-sm">
            <Form
              form={searchForm}
              layout="inline"
              onFinish={handleSearch}
              className="w-full"
            >
              <Row gutter={[16, 16]} className="w-full">
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="keyword" className="w-full mb-0">
                    <Input
                      placeholder="搜索任务标题、内容、处理人或项目"
                      prefix={<SearchOutlined className="text-gray-400" />}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="member" className="w-full mb-0">
                    <Select placeholder="选择处理人" allowClear>
                      <Option value="all">全部成员</Option>
                      {mockUsers.map(user => (
                        <Option key={user} value={user}>{user}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={8} lg={12}>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                      搜索
                    </Button>
                    <Button onClick={handleReset} icon={<SearchOutlined />}>
                      重置
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={handleCreateModalOpen}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                      添加
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* 标签页 */}
          <Card className="mb-6 shadow-sm">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
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
        </>
      )}

      {/* 任务列表 */}
      {renderExpandableTaskList()}

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
            {displayMode === 'pendingOnly' ? '暂无待办任务' : (searchForm.getFieldValue('keyword') || searchForm.getFieldValue('member') ? '没有找到匹配的任务' : `暂无${activeTab === 'pending' ? '待办' : '已办'}任务`)}
          </div>
          <div className="text-gray-400 text-sm">
            {displayMode === 'pendingOnly' ? '请稍后再试或联系管理员' : (searchForm.getFieldValue('keyword') || searchForm.getFieldValue('member') ? '请尝试调整搜索关键词' : '点击右上角按钮添加')}
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <span>任务详情: {selectedTask.title}</span>
              {getPriorityTag(selectedTask.priority)}
              {getStatusTag(selectedTask.status)}
            </div>
          }
          visible={isDetailsModalVisible}
          onCancel={handleDetailsModalCancel}
          footer={[
            <Button key="back" onClick={handleDetailsModalCancel}>
              关闭
            </Button>,
            ...(selectedTask.status === 'pending' ? [
              <Button key="transfer" icon={<SendOutlined />} onClick={() => handleTransferModalOpen(selectedTask)}>
                处理任务
              </Button>,
              <Button key="edit" icon={<EditOutlined />} onClick={() => handleEditModalOpen(selectedTask)}>
                编辑
              </Button>
            ] : []),
            ...(selectedTask.status === 'draft' ? [
              <Button key="transfer" icon={<SendOutlined />} onClick={() => handleTransferModalOpen(selectedTask)}>
                派发任务
              </Button>
            ] : []),
            <Popconfirm
              title="确定要删除此任务吗？"
              onConfirm={() => handleDeleteTask(selectedTask.id)}
              okText="是"
              cancelText="否"
            >
              <Button key="delete" type="primary" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>,
          ]}
          width={800}
        >
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>当前处理人:</Text> {selectedTask.currentAssignee}
              </Col>
              <Col span={12}>
                <Text strong>所属项目:</Text> {selectedTask.project || '未指定'}
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>开始时间:</Text> {formatDate(selectedTask.startDate)}
              </Col>
              <Col span={12}>
                <Text strong>结束时间:</Text> {formatDate(selectedTask.endDate)}
              </Col>
            </Row>

            <div>
              <Text strong>任务内容:</Text>
              <Paragraph className="mt-2">{selectedTask.content}</Paragraph>
            </div>

            <div>
              <Text strong>完成进度:</Text>
              <Progress 
                percent={selectedTask.progress} 
                className="mt-2"
                strokeColor={selectedTask.status === 'completed' ? '#52c41a' : '#1890ff'}
              />
            </div>

            {/* 流转历史 */}
            {selectedTask.flowHistory.length > 0 && (
              <div>
                <Divider />
                <Title level={4}>流转历史</Title>
                <List
                  size="small"
                  dataSource={selectedTask.flowHistory}
                  renderItem={flow => (
                    <List.Item>
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-1">
                          <Text strong>
                            {flow.fromUser} → {flow.toUser}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            {formatDateTime(flow.timestamp)}
                          </Text>
                        </div>
                        <Text type="secondary" className="block mb-1">
                          {flow.action === 'transfer' ? '转交任务' : '完成任务'}
                        </Text>
                        <Text className="block">{flow.notes}</Text>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )}

            <Divider />

            <div>
              <div className="flex justify-between items-center mb-3">
                <Title level={4} className="m-0">子任务</Title>
                {!showAddSubtaskForm && (
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => setShowAddSubtaskForm(true)}
                    icon={<PlusOutlined />}
                  >
                    添加子任务
                  </Button>
                )}
              </div>

              {selectedTask.subtasks.length > 0 ? (
                <List
                  bordered
                  dataSource={selectedTask.subtasks}
                  renderItem={subtask => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteSubtask(subtask.id)}
                        />,
                      ]}
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-1">
                          <Text strong>{subtask.title}</Text>
                        </div>
                        <Text type="secondary" className="block mb-1">{subtask.content}</Text>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂无子任务
                </div>
              )}

              {showAddSubtaskForm && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <Title level={5} className="mb-3">添加子任务</Title>
                  <Form
                    form={subtaskForm}
                    layout="vertical"
                    onFinish={handleAddSubtask}
                  >
                    <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              name="title"
                              label="子任务标题"
                              rules={[{ required: true, message: '请输入子任务标题！' }]}
                            >
                              <Input placeholder="请输入子任务标题" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name="assignee"
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
                        
                        <Form.Item
                          name="content"
                          label="子任务内容"
                          rules={[{ required: true, message: '请输入子任务内容！' }]}
                        >
                          <TextArea rows={3} placeholder="请输入子任务内容" />
                        </Form.Item>

                    <div className="flex gap-2">
                      <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                        添加
                      </Button>
                      <Button onClick={() => setShowAddSubtaskForm(false)}>
                        取消
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Task Modal */}
      <Modal
        title="添加"
        visible={isCreateModalVisible}
        onCancel={handleCreateModalCancel}
        footer={null}
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
                      subtasks: [...currentSubtasks, { id: `temp_${Date.now()}`, title: '', content: '' }]
                    });
                  }}
                >
                  添加子任务
                </Button>
              </div>
              
              <Form.List name="subtasks">
                {(fields, { add, remove }) => (
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
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Task Modal */}
      {selectedTask && (
        <Modal
          title="编辑"
          visible={isEditModalVisible}
          onCancel={handleEditModalCancel}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditTask}
            initialValues={selectedTask}
          >
            <Form.Item
              name="title"
              label="任务标题"
              rules={[{ required: true, message: '请输入任务标题！' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="content"
              label="任务内容"
              rules={[{ required: true, message: '请输入任务内容！' }]}
            >
              <TextArea rows={4} />
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
                        subtasks: [...currentSubtasks, { id: `temp_${Date.now()}`, title: '', content: '' }]
                      });
                    }}
                  >
                    添加子任务
                  </Button>
                </div>
                
                <Form.List name="subtasks">
                  {(fields, { add, remove }) => (
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
                保存更改
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* Transfer Task Modal */}
      {selectedTask && (
        <Modal
          title={selectedTask.status === 'draft' ? "派发任务" : "任务流转"}
          visible={isTransferModalVisible}
          onCancel={handleTransferModalCancel}
          footer={null}
        >
          <Form
            form={transferForm}
            layout="vertical"
            onFinish={handleTransferTask}
          >
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <Text strong>当前任务: {selectedTask.title}</Text>
              <br />
              <Text type="secondary">当前处理人: {selectedTask.currentAssignee}</Text>
            </div>

            <Form.Item
              name="toUser"
              label="选择接收人"
              rules={[{ required: true, message: '请选择接收人！' }]}
            >
              <Select placeholder="选择接收人">
                {mockUsers.filter(user => user !== selectedTask.currentAssignee).map(user => (
                  <Option key={user} value={user}>{user}</Option>
                ))}
              </Select>
            </Form.Item>

            {/* 只有待办任务才显示完成情况和流转操作 */}
            {selectedTask.status === 'pending' && (
              <>
                <Form.Item
                  name="notes"
                  label="完成情况"
                  rules={[{ required: true, message: '请记录完成情况！' }]}
                >
                  <TextArea 
                    rows={4} 
                    placeholder="请记录本次处理的内容、遇到的问题、解决方案等..."
                  />
                </Form.Item>

                <Form.Item label="流转操作">
                  <Radio.Group 
                    value={transferAction} 
                    onChange={(e) => setTransferAction(e.target.value)}
                  >
                    <Space direction="vertical">
                      <Radio value="transfer">
                        <Space>
                          <SendOutlined />
                          转交下一人 (继续流转)
                        </Space>
                      </Radio>
                      <Radio value="complete">
                        <Space>
                          <CheckCircleOutlined />
                          完成任务 (结束流程)
                        </Space>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                  {selectedTask.status === 'draft' ? '派发任务' : (transferAction === 'transfer' ? '转交任务' : '完成任务')}
                </Button>
                <Button onClick={handleTransferModalCancel}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default Task;
