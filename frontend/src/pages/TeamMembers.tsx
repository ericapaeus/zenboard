import React from 'react';
import { Table, Button, Space, Tag, Typography, message, Modal, Form, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Member {
  key: string;
  username: string;
  email: string;
  status: 'pending' | 'unverified' | 'active';
}

const mockMembers: Member[] = [
  {
    key: '1',
    username: '张三',
    email: 'zhangsan@example.com',
    status: 'pending',
  },
  {
    key: '2',
    username: '李四',
    email: 'lisi@example.com',
    status: 'unverified',
  },
  {
    key: '3',
    username: '王五',
    email: 'wangwu@example.com',
    status: 'active',
  },
  {
    key: '4',
    username: '赵六',
    email: 'zhaoliu@example.com',
    status: 'pending',
  },
];

const TeamMembers: React.FC = () => {
  const [isInviteModalVisible, setIsInviteModalVisible] = React.useState(false);
  const [inviteForm] = Form.useForm();

  const handleApprove = (member: Member) => {
    message.success(`已批准成员: ${member.username}`);
    // In a real application, you would send an API request here
  };

  const handleReject = (member: Member) => {
    message.warning(`已拒绝成员: ${member.username}`);
    // In a real application, you would send an API request here
  };

  const handleDisable = (member: Member) => {
    message.info(`已禁用成员: ${member.username}`);
    // In a real application, you would send an API request here
  };

  const handleInviteModalOpen = () => {
    setIsInviteModalVisible(true);
    inviteForm.resetFields();
  };

  const handleInviteModalCancel = () => {
    setIsInviteModalVisible(false);
    inviteForm.resetFields();
  };

  const handleSendInvitation = (values: { emails: string }) => {
    message.success(`已向 ${values.emails} 发送邀请邮件！`);
    // In a real application, you would send an API request here
    handleInviteModalCancel();
  };

  const columns: ColumnsType<Member> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱/手机',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <>
              <Button type="primary" onClick={() => handleApprove(record)}>批准</Button>
              <Button danger onClick={() => handleReject(record)}>拒绝</Button>
            </>
          )}
          {record.status === 'active' && (
            <Button danger onClick={() => handleDisable(record)}>禁用</Button>
          )}
          {/* 未验证状态无操作 */}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0">成员管理</Title>
        <Button type="primary" onClick={handleInviteModalOpen}>邀请成员</Button>
      </div>
      <Table columns={columns} dataSource={mockMembers} pagination={false} />

      {/* Invite Member Modal */}
      <Modal
        title="邀请新成员"
        visible={isInviteModalVisible}
        onCancel={handleInviteModalCancel}
        footer={null}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleSendInvitation}
        >
          <Form.Item
            name="emails"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址！' },
              { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+(,[^\s@]+@[^\s@]+\.[^\s@]+)*$/, message: '请输入有效的邮箱地址，多个请用逗号分隔！' }
            ]}
          >
            <Input.TextArea rows={4} placeholder="请输入一个或多个邮箱地址，用逗号分隔" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              发送邮件邀请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamMembers;
