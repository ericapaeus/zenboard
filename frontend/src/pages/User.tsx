import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Tag, Form, Input, Select, Card, Row, Col, Spin, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUpdateUser, useDeleteUser, useAuthUsers, useApproveUser, useRejectUser } from '../hooks/useApi';
import type { User } from '../hooks/useApi';

const { Option } = Select;

// 使用 User 类型替代 Member 类型，保持一致性
interface EditFormData {
  name: string;
  phone: string;
  email: string;
  hire_date?: string;
  contract_expiry?: string;
}

const User: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 获取当前用户信息
  const getCurrentUser = (): User | null => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  };

  const [currentUser] = useState<User | null>(getCurrentUser());

  // 使用 hooks - 修复属性名
  const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } = useAuthUsers();
  const { updateUser, loading: updateLoading } = useUpdateUser();
  const { deleteUser, loading: deleteLoading } = useDeleteUser();
  const { approveUser, loading: approveLoading } = useApproveUser();
  const { rejectUser, loading: rejectLoading } = useRejectUser();

  // 权限控制 - 修复逻辑
  const canEdit = useCallback((member: User) => {
    if (!currentUser) return false;
    if (currentUser.role === '管理员') return true;
    return currentUser.id === member.id;
  }, [currentUser]);

  const canDelete = useCallback((member: User) => {
    if (!currentUser) return false;
    if (currentUser.role !== '管理员') return false;
    return currentUser.id !== member.id;
  }, [currentUser]);

  // 过滤用户列表
  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    
    let filtered = usersData;
    
    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword)
      );
    }
    
    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    return filtered;
  }, [usersData, searchKeyword, statusFilter]);

  // 处理用户更新
  const handleUpdateUser = useCallback(async (values: EditFormData) => {
    if (!editingUser) return;
    
    try {
      await updateUser(editingUser.id.toString(), values);
      setIsEditModalOpen(false);
      setEditingUser(null);
      editForm.resetFields();
      refetchUsers();
    } catch (error) {
      // 错误提示已由 hook 自动处理
      console.error('更新用户失败:', error);
    }
  }, [editingUser, updateUser, editForm, refetchUsers]);

  // 处理用户删除
  const handleDeleteUser = useCallback(async (userId: number) => {
    try {
      await deleteUser(userId.toString());
      refetchUsers();
    } catch (error) {
      // 错误提示已由 hook 自动处理
      console.error('删除用户失败:', error);
    }
  }, [deleteUser, refetchUsers]);

  // 处理用户审批
  const handleApproveUser = useCallback(async (userId: number) => {
    try {
      await approveUser(userId.toString());
      refetchUsers();
    } catch (error) {
      // 错误提示已由 hook 自动处理
      console.error('审批用户失败:', error);
    }
  }, [approveUser, refetchUsers]);

  // 处理用户拒绝
  const handleRejectUser = useCallback(async (userId: number) => {
    try {
      await rejectUser(userId.toString());
      refetchUsers();
    } catch (error) {
      // 错误提示已由 hook 自动处理
      console.error('拒绝用户失败:', error);
    }
  }, [rejectUser, refetchUsers]);

  // 打开编辑模态框
  const openEditModal = useCallback((user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      name: user.name,
      phone: user.phone,
      email: user.email,
      hire_date: user.hire_date,
      contract_expiry: user.contract_expiry,
    });
    setIsEditModalOpen(true);
  }, [editForm]);

  // 关闭编辑模态框
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    editForm.resetFields();
  }, [editForm]);

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text) => text || '未设置',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '未设置',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text || '未设置',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === '管理员' ? 'red' : 'blue'}>
          {role || '未设置'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap: Record<string, string> = {
          '未审核': 'orange',
          '待审核': 'blue',
          '已通过': 'green',
          '已拒绝': 'red',
        };
        return (
          <Tag color={colorMap[status] || 'default'}>
            {status || '未知'}
          </Tag>
        );
      },
    },
    {
      title: '入职日期',
      dataIndex: 'hire_date',
      key: 'hire_date',
      render: (date) => date || '未设置',
    },
    {
      title: '合同到期',
      dataIndex: 'contract_expiry',
      key: 'contract_expiry',
      render: (date) => date || '未设置',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const isPending = record.status === '待审核';
        
        if (isPending) {
          return (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                loading={approveLoading}
                onClick={() => handleApproveUser(record.id)}
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                loading={rejectLoading}
                onClick={() => handleRejectUser(record.id)}
              >
                拒绝
              </Button>
            </Space>
          );
        }
        
        return (
          <Space size="small">
            {canEdit(record) && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              >
                编辑
              </Button>
            )}
            {canDelete(record) && (
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteUser(record.id)}
              >
                删除
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // 处理搜索
  const handleSearch = useCallback((values: any) => {
    setSearchKeyword(values.keyword || '');
    setStatusFilter(values.status || 'all');
  }, []);

  // 处理重置
  const handleReset = useCallback(() => {
    searchForm.resetFields();
    setSearchKeyword('');
    setStatusFilter('all');
  }, [searchForm]);

  // 处理刷新
  const handleRefresh = useCallback(() => {
    refetchUsers();
  }, [refetchUsers]);

  // 处理错误
  useEffect(() => {
    if (usersError) {
      console.error('获取用户列表失败:', usersError);
    }
  }, [usersError]);

  return (
    <div style={{ padding: 24 }}>
      {/* 搜索区域 */}
      <Card className="mb-6 shadow-sm">
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          className="w-full"
        >
          <Row gutter={[8, 8]} wrap align="middle">
            <Col flex="none">
              <Form.Item name="keyword" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="搜索姓名或邮箱"
                  allowClear
                  style={{ width: 260 }}
                  prefix={<SearchOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col flex="none">
              <Form.Item name="status" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="选择状态"
                  allowClear
                  style={{ width: 140 }}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '未审核', value: '未审核' },
                    { label: '待审核', value: '待审核' },
                    { label: '已通过', value: '已通过' },
                    { label: '已拒绝', value: '已拒绝' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col flex="none">
              <Space size={8}>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
                <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={usersLoading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      </Card>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户信息"
        open={isEditModalOpen}
        onCancel={closeEditModal}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名！' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          
          <Form.Item
            label="电话"
            name="phone"
            rules={[{ required: true, message: '请输入电话！' }]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
          
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱！' },
              { type: 'email', message: '请输入有效的邮箱地址！' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          
          <Form.Item label="入职日期" name="hire_date">
            <Input placeholder="请输入入职日期" />
          </Form.Item>
          
          <Form.Item label="合同到期" name="contract_expiry">
            <Input placeholder="请输入合同到期日期" />
          </Form.Item>
          
          <Form.Item style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" onClick={() => editForm.submit()} loading={updateLoading}>
                保存
              </Button>
              <Button onClick={closeEditModal}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default User;
