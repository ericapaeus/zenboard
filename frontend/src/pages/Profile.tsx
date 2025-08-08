import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  DatePicker, 
  message, 
  Row, 
  Col, 
  Avatar, 
  Upload,
  Space
} from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  CameraOutlined,
  SaveOutlined,
  EditOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';

interface ProfileData {
  name: string;
  phone: string;
  email: string;
  contractStartDate: string;
  contractEndDate: string;
  avatar?: string;
}

export default function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '张三',
    phone: '13800138000',
    email: 'zhangsan@company.com',
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    avatar: '',
  });

  // 模拟获取个人资料数据
  useEffect(() => {
    // 这里可以调用 API 获取用户资料
    console.log('加载个人资料数据');
  }, []);

  // 处理表单提交
  const handleSubmit = async (values: ProfileData & { contractStartDate?: dayjs.Dayjs; contractEndDate?: dayjs.Dayjs }) => {
    setLoading(true);
    try {
      // 转换日期格式
      const formData = {
        ...values,
        contractStartDate: values.contractStartDate?.format('YYYY-MM-DD'),
        contractEndDate: values.contractEndDate?.format('YYYY-MM-DD'),
      };

      console.log('提交的数据:', formData);
      
      // 这里可以调用 API 保存数据
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟 API 调用
      
      setProfileData(formData);
      setEditing(false);
      message.success('个人资料更新成功！');
    } catch {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传配置
  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片！');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB！');
        return false;
      }
      return false; // 阻止自动上传
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success('头像上传成功');
      }
    },
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">个人资料</h1>
        <p className="text-gray-500 mt-1">管理您的个人信息和账户设置</p>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧：头像 */}
        <Col xs={24} lg={8}>
          <Card title="头像设置" className="mb-6">
            <div className="text-center">
              <div className="relative inline-block">
                <Avatar 
                  size={120} 
                  src={profileData.avatar}
                  icon={<UserOutlined />}
                  className="mb-4"
                />
                <Upload {...uploadProps}>
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<CameraOutlined />}
                    className="absolute bottom-2 right-2"
                    size="small"
                  />
                </Upload>
              </div>
              <p className="text-gray-500 text-sm">点击相机图标更换头像</p>
            </div>
          </Card>
        </Col>

        {/* 右侧：详细信息表单 */}
        <Col xs={24} lg={16}>
          <Card 
            title="详细信息" 
            extra={
              <Button 
                type={editing ? "default" : "primary"}
                icon={editing ? <SaveOutlined /> : <EditOutlined />}
                onClick={() => editing ? form.submit() : setEditing(true)}
                loading={loading}
              >
                {editing ? '保存' : '编辑'}
              </Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                ...profileData,
                contractStartDate: profileData.contractStartDate ? dayjs(profileData.contractStartDate) : null,
                contractEndDate: profileData.contractEndDate ? dayjs(profileData.contractEndDate) : null,
              }}
              onFinish={handleSubmit}
              disabled={!editing}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="姓名"
                    name="name"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="请输入姓名"
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="手机号"
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input 
                      prefix={<PhoneOutlined />} 
                      placeholder="请输入手机号"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入正确的邮箱格式' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="请输入邮箱"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="合同开始时间"
                    name="contractStartDate"
                    rules={[{ required: true, message: '请选择合同开始时间' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      placeholder="请选择合同开始时间"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="合同到期时间"
                    name="contractEndDate"
                    rules={[{ required: true, message: '请选择合同到期时间' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      placeholder="请选择合同到期时间"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {editing && (
                <div className="mt-6 pt-4 border-t">
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存更改
                    </Button>
                    <Button onClick={() => {
                      setEditing(false);
                      form.resetFields();
                    }}>
                      取消
                    </Button>
                  </Space>
                </div>
              )}
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 