import React, { useState } from 'react';
import { Card, Typography, Tag, Modal, Button, Input, Select, List, Form, message, Popconfirm, Row, Col, Space, Avatar, Divider, Pagination, DatePicker } from 'antd';
import { UserOutlined, InfoCircleOutlined, PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, SearchOutlined, CheckCircleFilled, ClockCircleFilled, EditFilled, DownOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Task, Subtask, TaskFlow } from '@/types';
import { useProjects, useAuthUsers, useCreateTask, useTasks, useCreateMessage } from '@/hooks/useApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
// const { RangePicker } = DatePicker;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [subtaskForm] = Form.useForm();
  
  // 模态框状态
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  // const [isTransferModalVisible, setIsTransferModalVisible] = useState(false); // 已删除
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  // const [transferAction, setTransferAction] = useState<'transfer' | 'complete'>('transfer'); // 已删除

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const { data: apiTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks();

  // 静态评论数据与输入框状态
  type TaskComment = { id: number; author_id: number; author_name?: string; author_avatar?: string; content: string; created_at: string };
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({
    '1': [
      { id: 1, author_id: 2, author_name: '李四', content: '先把基础数据补齐，我下班前看一版。', created_at: '2025-08-13 10:00:00' },
      { id: 2, author_id: 3, author_name: '王五', content: 'OK，我下午两点前给到。', created_at: '2025-08-13 10:15:00' },
    ],
    '2': [
      { id: 3, author_id: 4, author_name: '赵六', content: '会议议程我补充了两个点：质量与风险。', created_at: '2025-08-12 09:30:00' },
    ],
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const addTaskComment = (taskId: string) => {
    const content = (commentInputs[taskId] || '').trim();
    if (!content) { message.error('请输入评论内容'); return; }
    const nextId = Date.now();
    const next: TaskComment = { id: nextId, author_id: 0, author_name: '当前用户', content, created_at: new Date().toISOString() };
    setTaskComments(prev => ({ ...prev, [taskId]: [...(prev[taskId] || []), next] }));
    setCommentInputs(prev => ({ ...prev, [taskId]: '' }));
  };

  const { data: projectsData } = useProjects();
  const { data: usersData } = useAuthUsers();
  const { createTask } = useCreateTask();
  const { createMessage } = useCreateMessage();

  const getUserName = (id?: number | null) => {
    if (!id || !usersData) return '未分配';
    const u = usersData.find(u => u.id === id);
    return u?.name || `用户${id}`;
  };

  const getProjectName = (id?: string | null) => {
    if (id === undefined || id === null || !projectsData) return undefined as unknown as string;
    const p = projectsData.find(p => p.id === id);
    return p?.name;
  };

  const mapApiTaskToUi = (t: any): Task => ({
    id: String(t.id),
    title: t.title,
    content: t.description || '',
    currentAssignee: getUserName(t.assignee_id),
    originalAssignee: getUserName(t.original_assignee_id) || getUserName(t.assignee_id),
    startDate: t.created_at ? new Date(t.created_at).toISOString().slice(0,10) : '',
    endDate: t.due_date ? new Date(t.due_date).toISOString().slice(0,10) : '',
    progress: typeof t.progress === 'number' ? t.progress : 0,
    project: getProjectName(t.project_id != null ? String(t.project_id) : null),
    priority: (t.priority || 'medium'),
      subtasks: [],
      flowHistory: [],
    completionNotes: t.completion_notes || '',
    createdBy: getUserName(t.creator_id),
    createdAt: t.created_at || new Date().toISOString(),
  });

  React.useEffect(() => {
    if (apiTasks) {
      const mapped = (apiTasks as any[]).map(mapApiTaskToUi);
      setTasks(mapped);
    }
  }, [apiTasks, usersData, projectsData]);

  const mockUsers = (usersData || []).map(u => u.name || `用户${u.id}`);
  const mockProjects = (projectsData || []).map(p => p.name);

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

  // 已删除“处理任务/流转”相关逻辑

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
    try {
      const created = await createTask({
        title: values.title,
        description: values.content,
        priority: values.priority,
        assignee_id: values.assignee_id,
        project_id: values.project_id,
        parent_task_id: undefined,
        due_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
      });
      
      message.success('任务创建成功！');
      handleCreateModalCancel();
      refetchTasks();
      return created;
    } catch (e) {
      // 已在 hook 内提示
    }
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
  const getTasksByStatus = (_status: Task['status']) => tasks;

  // 初始化筛选结果
  React.useEffect(() => {
    // 后端获取完成后刷新分页
    setCurrentPage(1);
  }, [tasks]);

  // 过滤和分页逻辑
  const getCurrentTabTasks = () => {
    return tasks;
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
            <Button
            key="edit"
              type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditModalOpen(task)}
            >
            编辑
            </Button>
        ]}
      >
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <Title level={4} className="m-0 flex-1 mr-2">{task.title}</Title>
            <Space>
              {getPriorityTag(task.priority)}
            </Space>
          </div>
          
          <Paragraph className="text-gray-600 mb-3" ellipsis={{ rows: 2 }}>
            {task.content}
          </Paragraph>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <div className="flex items-center gap-2">
                <UserOutlined className="text-gray-400" />
                <Text type="secondary">任务负责人: {task.currentAssignee}</Text>
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

              {task.subtasks.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
                  <CheckCircleOutlined className="text-gray-400" />
                  <Text type="secondary">子任务: {task.subtasks.length} 个</Text>
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
              <Button
              key="edit"
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditModalOpen(task)}
              >
                编辑
              </Button>
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
              </Space>
            </div>
            
            <Paragraph className="text-gray-600 mb-3">
              {task.content}
            </Paragraph>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-gray-400" />
                  <Text type="secondary">任务负责人: {task.currentAssignee}</Text>
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

                {task.subtasks.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                    <CheckCircleOutlined className="text-gray-400" />
                    <Text type="secondary">子任务: {task.subtasks.length} 个</Text>
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
              {/* 评论 */}
              <div className="mb-6">
                <Title level={5} className="mb-3">评论</Title>
                  <List
                    size="small"
                    bordered
                  dataSource={taskComments[task.id] || []}
                  locale={{ emptyText: '暂无评论' }}
                  renderItem={(c: any) => (
                      <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar size="small" icon={<UserOutlined />} />}
                        title={<Text strong>{c.author_name || `用户${c.author_id}`}</Text>}
                        description={
                          <div>
                            <div style={{ background: '#fff' }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.content}</ReactMarkdown>
                            </div>
                            <Text type="secondary" className="text-xs">{formatDateTime(c.created_at)}</Text>
                            </div>
                        }
                      />
                      </List.Item>
                    )}
                  />
                <div className="mt-3">
                  <Input.TextArea
                    rows={3}
                    placeholder="输入评论，支持 Markdown"
                    value={commentInputs[task.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                  />
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <Button type="primary" size="small" onClick={() => addTaskComment(task.id)}>添加评论</Button>
                  </div>
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

      {/* 任务列表 */}
      {renderExpandableTaskList()}
      {/* 可根据需要显示加载状态 */}
      {/* {tasksLoading && <div style={{textAlign:'center', marginTop:12}}>加载中...</div>} */}

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
            {/* 已移除标签页 */}
          </div>
          <div className="text-gray-400 text-sm">
            {/* 已移除标签页 */}
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
            </div>
          }
          visible={isDetailsModalVisible}
          onCancel={handleDetailsModalCancel}
          footer={[
            <Button key="back" onClick={handleDetailsModalCancel}>
              关闭
              </Button>,
              <Button key="edit" icon={<EditOutlined />} onClick={() => handleEditModalOpen(selectedTask)}>
                编辑
            </Button>,
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
                <Text strong>任务负责人:</Text> {selectedTask.currentAssignee}
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

            {/* 评论 */}
                <Divider />
            <Title level={4}>评论</Title>
                <List
                  size="small"
              dataSource={taskComments[selectedTask.id] || []}
              locale={{ emptyText: '暂无评论' }}
              renderItem={(c: any) => (
                    <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar size="small" icon={<UserOutlined />} />}
                    title={<Text strong>{c.author_name || `用户${c.author_id}`}</Text>}
                    description={
                      <div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.content}</ReactMarkdown>
                        <Text type="secondary" className="text-xs">{formatDateTime(c.created_at)}</Text>
                        </div>
                    }
                  />
                    </List.Item>
                  )}
                />
            <div className="mt-3">
              <Input.TextArea
                rows={3}
                placeholder="输入评论，支持 Markdown"
                value={commentInputs[selectedTask.id] || ''}
                onChange={(e) => setCommentInputs(prev => ({ ...prev, [selectedTask.id]: e.target.value }))}
              />
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Button type="primary" size="small" onClick={() => addTaskComment(selectedTask.id)}>添加评论</Button>
              </div>
            </div>

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
                name="assignee_id"
                label="任务负责人"
                rules={[{ required: true, message: '请选择任务负责人！' }]}
              >
                <Select placeholder="选择任务负责人">
                  {(usersData || []).map(user => (
                    <Option key={user.id} value={user.id}>{user.name || `用户${user.id}`}</Option>
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
            name="project_id"
            label="所属项目"
          >
            <Select placeholder="选择所属项目（可选）">
              {(projectsData || []).map(project => (
                <Option key={project.id} value={Number(project.id)}>{project.name}</Option>
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
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'assignee']}
                                label="处理人"
                                rules={[{ required: true, message: '请选择子任务处理人！' }]}
                              >
                                <Select placeholder="选择处理人">
                                {(usersData || []).map(user => (
                                  <Option key={user.id} value={user.name || `用户${user.id}`}>{user.name || `用户${user.id}`}</Option>
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
                  label="任务负责人"
                  rules={[{ required: true, message: '请选择任务负责人！' }]}
                >
                  <Select placeholder="选择任务负责人">
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
                {(projectsData || []).map(project => (
                  <Option key={project.id} value={project.name}>{project.name}</Option>
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

      {/* 已移除处理任务/流转弹窗 */}
    </div>
  );
};

export default Task;
