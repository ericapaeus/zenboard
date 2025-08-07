import { Table, Tag, Switch, Button, Space } from 'antd';

const dataSource = [
  {
    key: '1',
    username: 'admin',
    nickname: '顶级管理员',
    phone: '13800138000',
    role: '顶级管理员',
    status: true,
    creator: 'admin',
    updatedAt: '2020-05-18 17:19:13',
  },
  {
    key: '2',
    username: 'test001',
    nickname: 'test001',
    phone: '13800138001',
    role: '测试',
    status: true,
    creator: 'admin',
    updatedAt: '2020-05-18 17:23:53',
  },
  {
    key: '3',
    username: 'user001',
    nickname: '普通用户',
    phone: '13800138002',
    role: '普通用户',
    status: false,
    creator: 'admin',
    updatedAt: '2020-05-18 17:25:10',
  },
];

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
    render: (role: string) => <Tag color={role === '顶级管理员' ? 'blue' : role === '测试' ? 'cyan' : 'default'}>{role}</Tag>,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: boolean) => <Switch checked={status} checkedChildren="启用" unCheckedChildren="关闭" disabled />,
  },
  {
    title: '创建人',
    dataIndex: 'creator',
    key: 'creator',
  },
  {
    title: '最近更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
  },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space>
        <Button type="link" size="small">编辑</Button>
        <Button type="link" size="small" danger>删除</Button>
      </Space>
    ),
  },
];

export default function UserList() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">用户列表</h1>
        <p className="text-gray-500">系统用户信息一览</p>
      </div>
      <Table dataSource={dataSource} columns={columns} pagination={{ pageSize: 10 }} bordered rowKey="key" />
    </>
  );
} 