import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Card, Spin, message } from 'antd';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useApi';

const { Option } = Select;

// 用户列表组件示例
export const UserListExample: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  // 使用自定义 hooks
  const { data: usersData, loading, error, refetch } = useUsers({
    page: 1,
    limit: 10,
  });

  const { createUser, loading: createLoading } = useCreateUser();
  const { updateUser, loading: updateLoading } = useUpdateUser();
  const { deleteUser, loading: deleteLoading } = useDeleteUser();

  // 处理创建用户
  const handleCreateUser = async (values: any) => {
    try {
      await createUser(values);
      setIsModalVisible(false);
      form.resetFields();
      refetch(); // 刷新列表
    } catch (error) {
      console.error('创建用户失败:', error);
    }
  };

  // 处理更新用户
  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;
    
    try {
      await updateUser(editingUser.id, values);
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      refetch(); // 刷新列表
    } catch (error) {
      console.error('更新用户失败:', error);
    }
  };

  // 处理删除用户
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      refetch(); // 刷新列表
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Switch
          checked={status === 'active'}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          disabled
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            loading={deleteLoading}
            onClick={() => handleDeleteUser(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (error) {
    return <div>错误: {error}</div>;
  }

  return (
    <div>
      <Card title="用户管理" extra={
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          添加用户
        </Button>
      }>
        <Table
          columns={columns}
          dataSource={usersData?.users || []}
          loading={loading}
          rowKey="id"
          pagination={{
            total: usersData?.total || 0,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* 创建/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '创建用户'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingUser ? handleUpdateUser : handleCreateUser}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="电话"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="user">普通用户</Option>
              <Option value="guest">访客</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createLoading || updateLoading}
              >
                {editingUser ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                setEditingUser(null);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// 认证组件示例
export const AuthExample: React.FC = () => {
  const { user, loading, login, logout, getCurrentUser } = useAuth();

  const handleLogin = async () => {
    try {
      // 模拟二维码登录
      await login('mock-qr-code');
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      message.success('退出登录成功');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  return (
    <Card title="认证状态">
      {loading ? (
        <Spin />
      ) : user ? (
        <div>
          <p>当前用户: {user.nickname}</p>
          <p>用户名: {user.username}</p>
          <p>角色: {user.role}</p>
          <Button onClick={handleLogout}>退出登录</Button>
        </div>
      ) : (
        <div>
          <p>未登录</p>
          <Button onClick={handleLogin}>模拟登录</Button>
          <Button onClick={getCurrentUser}>获取当前用户</Button>
        </div>
      )}
    </Card>
  );
};

// 项目列表组件示例
export const ProjectListExample: React.FC = () => {
  const { data: projects, loading, error, refetch } = useProjects();

  if (error) {
    return <div>错误: {error}</div>;
  }

  return (
    <Card title="项目列表">
      {loading ? (
        <Spin />
      ) : (
        <div>
          {projects?.map((project: any) => (
            <Card key={project.id} size="small" style={{ marginBottom: 8 }}>
              <h4>{project.name}</h4>
              <p>{project.description}</p>
              <p>状态: {project.status}</p>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

// 任务列表组件示例
export const TaskListExample: React.FC = () => {
  const { data: tasks, loading, error, refetch } = useMyTasks();

  if (error) {
    return <div>错误: {error}</div>;
  }

  return (
    <Card title="我的任务">
      {loading ? (
        <Spin />
      ) : (
        <div>
          {tasks?.map((task: any) => (
            <Card key={task.id} size="small" style={{ marginBottom: 8 }}>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <p>状态: {task.status}</p>
              <p>优先级: {task.priority}</p>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

// 主示例组件
export const ApiUsageExample: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h1>API 使用示例</h1>
      
      <div style={{ marginBottom: 24 }}>
        <AuthExample />
      </div>

      <div style={{ marginBottom: 24 }}>
        <UserListExample />
      </div>

      <div style={{ marginBottom: 24 }}>
        <ProjectListExample />
      </div>

      <div style={{ marginBottom: 24 }}>
        <TaskListExample />
      </div>
    </div>
  );
};

export default ApiUsageExample; 