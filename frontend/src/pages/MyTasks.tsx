import React, { useState } from 'react';
import { Card, Typography, Tag, Modal, Button, Input, Select, List, Form, message, Popconfirm } from 'antd';
import { UserOutlined, InfoCircleOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Subtask {
  id: string;
  content: string;
  assignee: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  description: string; // Brief description for card
  fullContent: string; // Full content for modal
  project: string;
  status: 'todo' | 'in-progress' | 'done';
  subtasks: Subtask[];
}

const MyTasks: React.FC = () => {
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subtaskForm] = Form.useForm();
  const [completionForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);

  // Mock data for tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: '完成项目报告',
      assignee: '张三',
      description: '撰写并提交本月的项目进度报告。',
      fullContent: '请详细撰写并提交本月的项目进度报告，包括已完成的工作、遇到的问题、解决方案和下一步计划。确保数据准确，并附上相关图表。',
      project: 'ZenBoard 后端开发',
      status: 'in-progress',
      subtasks: [
        { id: 's1', content: '收集数据', assignee: '张三', completed: false },
        { id: 's2', content: '撰写初稿', assignee: '张三', completed: false },
        { id: 's3', content: '图表制作', assignee: '李四', completed: false },
      ],
    },
    {
      id: '2',
      title: '安排团队会议',
      assignee: '李四',
      description: '与团队成员协调时间，安排下周的团队例会。',
      fullContent: '请与所有团队成员协调时间，安排下周的团队例会。会议议程包括：项目进展汇报、问题讨论、下阶段任务分配。请提前发送会议邀请。',
      project: 'ZenBoard 前端优化',
      status: 'todo',
      subtasks: [],
    },
    {
      id: '3',
      title: '审查代码',
      assignee: '王五',
      description: '审查新提交的代码，确保代码质量。',
      fullContent: '请审查最新提交的模块代码，确保代码质量、符合编码规范、无潜在bug，并提供详细的代码审查报告。',
      project: 'ZenBoard 数据库优化',
      status: 'done',
      subtasks: [
        { id: 's4', content: '模块A代码审查', assignee: '王五', completed: true },
        { id: 's5', content: '模块B代码审查', assignee: '赵六', completed: true },
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

  const showTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalVisible(true);
    completionForm.resetFields();
    setShowAddSubtaskForm(false);
  };

  const handleDetailsModalCancel = () => {
    setIsDetailsModalVisible(false);
    setSelectedTask(null);
    subtaskForm.resetFields();
    completionForm.resetFields();
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
    editForm.setFieldsValue(task); // Set form values for editing
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setSelectedTask(null);
    editForm.resetFields();
  };

  const handleAddSubtask = (values: { content: string; assignee: string }) => {
    if (selectedTask) {
      const newSubtask: Subtask = {
        id: `s${Date.now()}`,
        content: values.content,
        assignee: values.assignee,
        completed: false,
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

  const handleSubmitTask = async () => {
    if (selectedTask) {
      try {
        const values = await completionForm.validateFields();
        const updatedTasks = tasks.map(task =>
          task.id === selectedTask.id
            ? { ...task, status: 'done' as 'done' }
            : task
        );
        setTasks(updatedTasks);
        message.success(`任务 "${selectedTask.title}" 已提交！完成方案: ${values.completionDetails}`);
        handleDetailsModalCancel();
      } catch (errorInfo) {
        message.error('请填写任务完成方案及情况！');
      }
    }
  };

  const handleCreateTask = async (values: any) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: values.title,
      assignee: values.assignee,
      description: values.description,
      fullContent: values.fullContent,
      project: values.project,
      status: 'todo', // New tasks start as todo
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
          ? { ...task, ...values } // Merge updated values
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
    handleDetailsModalCancel(); // Close details modal after deleting
  };

  // Mock users for assignment
  const mockUsers = ['张三', '李四', '王五', '赵六', '孙七'];
  // Mock projects for assignment
  const mockProjects = ['ZenBoard 后端开发', 'ZenBoard 前端优化', 'ZenBoard 数据库优化', 'ZenBoard UI/UX 设计'];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0">我的任务</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateModalOpen}>
          创建任务
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => (
          <Card
            key={task.id}
            title={task.title}
            extra={getStatusTag(task.status)}
            hoverable
            className="shadow-md"
          >
            <Paragraph className="flex items-center gap-2 mb-2">
              <UserOutlined />
              <Text strong>指派人:</Text> {task.assignee}
            </Paragraph>
            <Paragraph className="mb-4">
              <Text strong>任务内容简介:</Text> {task.description}
            </Paragraph>
            <div className="flex justify-end">
              <Button
                type="link"
                icon={<InfoCircleOutlined />}
                onClick={() => showTaskDetails(task)}
              >
                详情
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          title={`任务详情: ${selectedTask.title}`}
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
            <Button key="submit" type="primary" onClick={handleSubmitTask}>
              提交任务
            </Button>,
          ]}
          width={800}
        >
          <Paragraph>
            <Text strong>所属项目:</Text> {selectedTask.project}
          </Paragraph>
          <Paragraph>
            <Text strong>任务内容:</Text> {selectedTask.fullContent}
          </Paragraph>

          <Title level={4} className="mt-6">子任务</Title>
          <List
            bordered
            dataSource={selectedTask.subtasks}
            renderItem={subtask => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  />,
                ]}
              >
                <Text delete={subtask.completed}>{subtask.content}</Text>
                <Tag className="ml-2">{subtask.assignee}</Tag>
              </List.Item>
            )}
          />

          {!showAddSubtaskForm && (
            <Button
              type="dashed"
              onClick={() => setShowAddSubtaskForm(true)}
              block
              icon={<PlusOutlined />}
              className="mt-4"
            >
              添加子任务
            </Button>
          )}

          {showAddSubtaskForm && (
            <>
              <Title level={5} className="mt-4">添加子任务</Title>
              <Form
                form={subtaskForm}
                layout="inline"
                onFinish={handleAddSubtask}
                className="mb-4"
              >
                <Form.Item
                  name="content"
                  rules={[{ required: true, message: '请输入子任务内容！' }]}
                >
                  <Input placeholder="子任务内容" style={{ width: 200 }} />
                </Form.Item>
                <Form.Item
                  name="assignee"
                  rules={[{ required: true, message: '请选择指派对象！' }]}
                >
                  <Select placeholder="指派对象" style={{ width: 120 }}>
                    {mockUsers.map(user => (
                      <Option key={user} value={user}>{user}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    添加
                  </Button>
                </Form.Item>
                <Form.Item>
                  <Button type="default" onClick={() => setShowAddSubtaskForm(false)}>
                    取消
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}

          <Title level={4} className="mt-6">任务完成方案及情况</Title>
          <Form form={completionForm} layout="vertical">
            <Form.Item
              name="completionDetails"
              rules={[{ required: true, message: '请填写任务完成方案及情况！' }]}
            >
              <TextArea rows={4} placeholder="请详细描述任务完成方案及情况..." />
            </Form.Item>
          </Form>
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
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="任务内容简介"
            rules={[{ required: true, message: '请输入任务内容简介！' }]}
          >
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="fullContent"
            label="完整任务内容"
            rules={[{ required: true, message: '请输入完整任务内容！' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
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
            initialValues={selectedTask} // Pre-fill form with selected task data
          >
            <Form.Item
              name="title"
              label="任务标题"
              rules={[{ required: true, message: '请输入任务标题！' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="任务内容简介"
              rules={[{ required: true, message: '请输入任务内容简介！' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
            <Form.Item
              name="fullContent"
              label="完整任务内容"
              rules={[{ required: true, message: '请输入完整任务内容！' }]}
            >
              <TextArea rows={4} />
            </Form.Item>
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
