import { Card, Table, Button, Input, Select, Space, Tag, Avatar, Switch, Modal, Form, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Search } = Input;
const { Option } = Select;

export default function UserList() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // 模拟用户数据
  const userData = [
    {
      key: '1',
      username: 'admin',
      nickname: '顶级管理员',
      phone: '13800138000',
      role: '顶级管理员',
      status: true,
      creator: 'admin',
      createTime: '2020-05-18 17:19:13',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
    {
      key: '2',
      username: 'test001',
      nickname: 'test001',
      phone: '13800138001',
      role: '测试',
      status: true,
      creator: 'admin',
      createTime: '2020-05-18 17:23:53',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test001',
    },
    {
      key: '3',
      username: 'user001',
      nickname: '普通用户',
      phone: '13800138002',
      role: '普通用户',
      status: false,
      creator: 'admin',
      createTime: '2020-05-18 17:25:10',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user001',
    },
  ];

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <span>{text}</span>
        </Space>
      ),
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
      render: (role) => (
        <Tag color="blue">{role}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Switch 
          checked={status} 
          checkedChildren="开启" 
          unCheckedChildren="关闭"
        />
      ),
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: '最近更新时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${record.username}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        message.success('删除成功');
      },
    });
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingUser) {
        message.success('更新成功');
      } else {
        message.success('添加成功');
      }
      setIsModalVisible(false);
    });
  };

  return (
    <div className="pt-20 pb-10 px-8 bg-[#f7f8fa] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
        <p className="text-gray-500 mt-1">管理系统用户信息</p>
      </div>

      {/* 搜索和操作区域 */}
      <Card className="mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Space size="large">
            <Space>
              <span className="text-gray-600">用户名:</span>
              <Search
                placeholder="用户名/电话"
                style={{ width: 200 }}
                allowClear
              />
            </Space>
            <Space>
              <span className="text-gray-600">状态:</span>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">全部状态</Option>
                <Option value="active">开启</Option>
                <Option value="inactive">关闭</Option>
              </Select>
            </Space>
          </Space>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              增加
            </Button>
          </Space>
        </div>
      </Card>

      {/* 用户列表表格 */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={userData}
          pagination={{
            total: userData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{
            type: 'checkbox',
          }}
        />
      </Card>

      {/* 添加/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: true }}
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
              <Option value="顶级管理员">顶级管理员</Option>
              <Option value="管理员">管理员</Option>
              <Option value="普通用户">普通用户</Option>
              <Option value="测试">测试</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}