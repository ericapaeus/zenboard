import React from 'react';
import { Table, Button, Space, Tag, message, Form, Input, Select, Card, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Member {
  key: string;
  username: string;
  phone: string;
  email: string;
  status: 'pending' | 'unverified' | 'active';
  hireDate: string;
  contractExpiry: string;
}

const mockMembers: Member[] = [
  {
    key: '1',
    username: '张三',
    phone: '13800138001',
    email: 'zhangsan@example.com',
    status: 'pending',
    hireDate: '2024-01-15',
    contractExpiry: '2026-01-15',
  },
  {
    key: '2',
    username: '李四',
    phone: '13800138002',
    email: 'lisi@example.com',
    status: 'unverified',
    hireDate: '2024-03-20',
    contractExpiry: '2026-03-20',
  },
  {
    key: '3',
    username: '王五',
    phone: '13800138003',
    email: 'wangwu@example.com',
    status: 'active',
    hireDate: '2023-08-10',
    contractExpiry: '2025-08-10',
  },
  {
    key: '4',
    username: '赵六',
    phone: '13800138004',
    email: 'zhaoliu@example.com',
    status: 'pending',
    hireDate: '2024-06-01',
    contractExpiry: '2026-06-01',
  },
];

const TeamMembers: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [filteredMembers, setFilteredMembers] = React.useState<Member[]>(mockMembers);

  // 搜索和筛选功能
  const handleSearch = (values: any) => {
    let filtered = [...mockMembers];
    
    // 关键词搜索
    if (values.keyword) {
      const keyword = values.keyword.toLowerCase();
      filtered = filtered.filter(member => 
        member.username.toLowerCase().includes(keyword) ||
        member.email.toLowerCase().includes(keyword)
      );
    }
    
    // 状态筛选
    if (values.status && values.status !== 'all') {
      filtered = filtered.filter(member => member.status === values.status);
    }
    
    setFilteredMembers(filtered);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setFilteredMembers(mockMembers);
  };

  // 通过成员
  const handleApprove = (member: Member) => {
    message.success(`已通过成员: ${member.username}`);
    // In a real application, you would send an API request here
  };

  // 拒绝成员
  const handleReject = (member: Member) => {
    message.warning(`已拒绝成员: ${member.username}`);
    // In a real application, you would send an API request here
  };

  const columns: ColumnsType<Member> = [
    {
      title: '姓名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: 'pending' | 'unverified' | 'active') => {
        let color = '';
        let text = '';
        if (status === 'pending') {
          color = 'gold';
          text = '待审批';
        } else if (status === 'unverified') {
          color = 'volcano';
          text = '未验证';
        } else {
          color = 'green';
          text = '已激活';
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '入职时间',
      dataIndex: 'hireDate',
      key: 'hireDate',
      width: 120,
      render: (date: string) => {
        return new Date(date).toLocaleDateString('zh-CN');
      },
    },
    {
      title: '合同到期时间',
      dataIndex: 'contractExpiry',
      key: 'contractExpiry',
      width: 140,
      render: (date: string) => {
        return new Date(date).toLocaleDateString('zh-CN');
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleApprove(record)}
          >
            通过
          </Button>
          <Button 
            danger 
            size="small"
            onClick={() => handleReject(record)}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

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
                  placeholder="搜索用户名或邮箱"
                  prefix={<SearchOutlined className="text-gray-400" />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" className="w-full mb-0">
                <Select placeholder="选择状态" allowClear>
                  <Option value="all">全部状态</Option>
                  <Option value="pending">待审批</Option>
                  <Option value="unverified">未验证</Option>
                  <Option value="active">已激活</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={12}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table 
        columns={columns} 
        dataSource={filteredMembers} 
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          pageSize: 10,
        }}
      />
    </div>
  );
};

export default TeamMembers;
