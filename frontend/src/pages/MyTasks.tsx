import React, { useState } from 'react';
import { Card, Typography, Tag, Modal, Button, Input, Select, List, Form, message, Popconfirm, Row, Col, Space, Avatar, Progress, Divider, Pagination } from 'antd';
import { UserOutlined, InfoCircleOutlined, PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Subtask {
  id: string;
  title: string;
  content: string;
  assignee?: string; // 改为可选字段
  parentId?: string; // 支持无限级子任务
  children?: Subtask[];
}

interface Task {
  id: string;
  title: string;
  content: string;
  assignee: string;
  startDate: string;
  endDate: string;
  status: 'todo' | 'in-progress' | 'done';
  progress: number; // 完成进度 0-100
  project: string;
  priority: 'low' | 'medium' | 'high';
  subtasks: Subtask[];
  completionNotes?: string; // 完成情况备注
}

const MyTasks: React.FC = () => {
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subtaskForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const [searchForm] = Form.useForm();
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Mock data for tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '完成项目报告',
      content: '撰写并提交本月的项目进度报告，包括已完成的工作、遇到的问题、解决方案和下一步计划。',
      assignee: '张三',
      startDate: '2024-01-15',
      endDate: '2024-01-25',
      status: 'in-progress',
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
        {
          id: 's3',
          title: '图表制作',
          content: '制作项目进度图表',
          assignee: '李四',
        },
      ],
    },
    {
      id: '2',
      title: '安排团队会议',
      content: '与团队成员协调时间，安排下周的团队例会。会议议程包括：项目进展汇报、问题讨论、下阶段任务分配。',
      assignee: '李四',
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      status: 'todo',
      progress: 0,
      project: 'ZenBoard 前端优化',
      priority: 'medium',
      subtasks: [],
    },
    {
      id: '3',
      title: '审查代码',
      content: '审查最新提交的模块代码，确保代码质量、符合编码规范、无潜在bug，并提供详细的代码审查报告。',
      assignee: '王五',
      startDate: '2024-01-10',
      endDate: '2024-01-15',
      status: 'done',
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
        {
          id: 's5',
          title: '模块B代码审查',
          content: '审查数据管理模块代码',
          assignee: '赵六',
        },
      ],
    },
  ]);

  const getStatusTag = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return <Tag color="blue">待办</Tag>;
      case 'in-progress':
        return <Tag color="processing">进行中</Tag>;
      case 'done':
        return <Tag color="success">已完成</Tag>;
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

  const showTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalVisible(true);
    setShowAddSubtaskForm(false);
    setCompletionNotes(task.completionNotes || '');
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
  };

  const handleCreateModalCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  const handleEditModalOpen = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalVisible(true);
    editForm.setFieldsValue(task);
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setSelectedTask(null);
    editForm.resetFields();
  };

  const handleAddSubtask = (values: any) => {
    if (selectedTask) {
      const newSubtask: Subtask = {
        id: `s${Date.now()}`,
        title: values.title,
        content: values.content,
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
      assignee: values.assignee,
      startDate: values.startDate,
      endDate: values.endDate,
      status: 'todo',
      progress: 0,
      project: values.project,
      priority: values.priority,
      subtasks: [],
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    message.success('任务创建成功！');
    handleCreateModalCancel();
  };

  const handleEditTask = async (values: any) => {
    if (selectedTask) {
      const updatedTasks = tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, ...values }
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

  // Mock users for assignment
  const mockUsers = ['张三', '李四', '王五', '赵六', '孙七'];
  // Mock projects for assignment
  const mockProjects = ['ZenBoard 后端开发', 'ZenBoard 前端优化', 'ZenBoard 数据库优化', 'ZenBoard UI/UX 设计'];

  // 搜索和筛选功能
  const handleSearch = (values: any) => {
    let filtered = [...tasks];
    
    // 关键词搜索
    if (values.keyword) {
      const keyword = values.keyword.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(keyword) ||
        task.content.toLowerCase().includes(keyword) ||
        task.assignee.toLowerCase().includes(keyword) ||
        task.project.toLowerCase().includes(keyword)
      );
    }
    
    // 成员筛选
    if (values.member && values.member !== 'all') {
      filtered = filtered.filter(task => 
        task.assignee === values.member
      );
    }
    
    setFilteredTasks(filtered);
    setCurrentPage(1); // 重置到第一页
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setFilteredTasks(tasks);
    setCurrentPage(1);
  };

  // 初始化筛选结果
  React.useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  // 过滤和分页逻辑
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredTasks.length / pageSize);

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
                  placeholder="搜索任务标题、内容、指派人或项目"
                  prefix={<SearchOutlined className="text-gray-400" />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="member" className="w-full mb-0">
                <Select placeholder="选择指派人" allowClear>
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
                  创建任务
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        {paginatedTasks.map(task => (
          <Col xs={24} sm={12} lg={8} key={task.id}>
            <Card
              hoverable
              className="h-full shadow-sm"
              style={{ borderTop: `4px solid ${task.priority === 'high' ? '#ff4d4f' : task.priority === 'medium' ? '#faad14' : '#52c41a'}` }}
              actions={[
                <Button
                  type="link"
                  icon={<InfoCircleOutlined />}
                  onClick={() => showTaskDetails(task)}
                >
                  详情
                </Button>
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserOutlined className="text-gray-400" />
                    <Text type="secondary">指派人: {task.assignee}</Text>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-gray-400" />
                    <Text type="secondary">
                      {formatDate(task.startDate)} - {formatDate(task.endDate)}
                    </Text>
                  </div>

                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined className="text-gray-400" />
                    <Text type="secondary">项目: {task.project}</Text>
                  </div>
                </div>

                <Divider className="my-3" />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Text strong>完成进度</Text>
                    <Text type="secondary">{task.progress}%</Text>
                  </div>
                  <Progress 
                    percent={task.progress} 
                    size="small"
                    strokeColor={task.status === 'done' ? '#52c41a' : task.status === 'in-progress' ? '#1890ff' : '#d9d9d9'}
                  />
                  
                  {task.subtasks.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircleOutlined className="text-gray-400" />
                      <Text type="secondary">子任务: {task.subtasks.length} 个</Text>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 空状态显示 */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {searchForm.getFieldValue('keyword') || searchForm.getFieldValue('member') ? '没有找到匹配的任务' : '暂无任务'}
          </div>
          <div className="text-gray-400 text-sm">
            {searchForm.getFieldValue('keyword') || searchForm.getFieldValue('member') ? '请尝试调整搜索关键词' : '点击右上角按钮创建新任务'}
          </div>
        </div>
      )}

      {/* 分页组件 */}
      {filteredTasks.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            current={currentPage}
            total={filteredTasks.length}
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
                <Text strong>指派人:</Text> {selectedTask.assignee}
              </Col>
              <Col span={12}>
                <Text strong>所属项目:</Text> {selectedTask.project}
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
                strokeColor={selectedTask.status === 'done' ? '#52c41a' : '#1890ff'}
              />
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

              {/* 完成情况记录 */}
              <div className="mt-6">
                <Text strong>完成情况:</Text>
                <div className="mt-2">
                  <TextArea
                    rows={4}
                    placeholder="请记录任务的完成情况、遇到的问题、解决方案等..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    className="mt-2"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={() => {
                        if (selectedTask) {
                          const updatedTasks = tasks.map(task =>
                            task.id === selectedTask.id
                              ? { ...task, completionNotes: completionNotes }
                              : task
                          );
                          setTasks(updatedTasks);
                          setSelectedTask(prev => prev ? { ...prev, completionNotes: completionNotes } : null);
                          message.success('完成情况已保存');
                        }
                      }}
                    >
                      保存完成情况
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Task Modal */}
      <Modal
        title="创建新任务"
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
                label="指派人"
                rules={[{ required: true, message: '请选择指派人！' }]}
              >
                <Select placeholder="选择指派人">
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
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间！' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="project"
            label="所属项目"
            rules={[{ required: true, message: '请选择所属项目！' }]}
          >
            <Select placeholder="选择所属项目">
              {mockProjects.map(project => (
                <Option key={project} value={project}>{project}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建任务
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Task Modal */}
      {selectedTask && (
        <Modal
          title={`编辑任务: ${selectedTask.title}`}
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
                  name="assignee"
                  label="指派人"
                  rules={[{ required: true, message: '请选择指派人！' }]}
                >
                  <Select placeholder="选择指派人">
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
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label="结束时间"
                  rules={[{ required: true, message: '请选择结束时间！' }]}
                >
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="project"
              label="所属项目"
              rules={[{ required: true, message: '请选择所属项目！' }]}
            >
              <Select placeholder="选择所属项目">
                {mockProjects.map(project => (
                  <Option key={project} value={project}>{project}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                保存更改
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default MyTasks;
