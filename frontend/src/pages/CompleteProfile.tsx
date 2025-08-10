import React, { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, message, Card, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useUpdateProfile } from '@/hooks/useApi';

interface ProfileData {
  name: string;
  phone: string;
  email: string;
  contractStartDate?: dayjs.Dayjs;
  contractEndDate?: dayjs.Dayjs;
}

interface UserInfo {
  id: number;
  email?: string;
  name?: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  hire_date?: string;
  contract_expiry?: string;
  created_at: string;
  updated_at: string;
}

export default function CompleteProfile() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // 使用 useUpdateProfile hook
  const { updateProfile, loading } = useUpdateProfile();

  // 获取当前用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // 从 localStorage 获取用户信息
        const storedUserInfo = localStorage.getItem("userInfo");
        if (storedUserInfo) {
          const user = JSON.parse(storedUserInfo);
          setUserInfo(user);
          
          // 如果用户状态不是"未审核"，跳转到首页
          if (user.status !== "未审核") {
            navigate("/");
            return;
          }
        } else {
          // 如果没有存储的用户信息，跳转到登录页
          navigate("/login");
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        message.error("获取用户信息失败");
        navigate("/login");
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleSubmit = async (values: ProfileData & { contractStartDate?: dayjs.Dayjs; contractEndDate?: dayjs.Dayjs }) => {
    try {
      const updateData = {
        name: values.name,
        phone: values.phone,
        email: values.email,
        hire_date: values.contractStartDate?.toDate(),
        contract_expiry: values.contractEndDate?.toDate(),
        status: "待审核" // 提交后状态变为待审核
      };

      const res = await updateProfile(updateData);
      if (res.success) {
        // 移除重复的成功消息，因为 useUpdateProfile hook 已经显示了
        // 更新本地存储的用户信息
        const updatedUserInfo = { ...userInfo, ...updateData, status: "待审核" };
        localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
        // 跳转到等待审核页面
        navigate("/pending-review");
      }
    } catch (error) {
      // 错误处理已经在 useUpdateProfile hook 中完成
      console.error("提交资料失败:", error);
    }
  };

  if (!userInfo) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <div className="text-center mb-8">
          <Avatar size={64} icon={<UserOutlined />} className="mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">完善个人资料</h1>
          <p className="text-gray-600">请填写以下信息，提交后等待管理员审核</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: userInfo.name || '',
            phone: userInfo.phone || '',
            email: userInfo.email || '',
            contractStartDate: userInfo.hire_date ? dayjs(userInfo.hire_date) : undefined,
            contractEndDate: userInfo.contract_expiry ? dayjs(userInfo.contract_expiry) : undefined,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入您的姓名" />
            </Form.Item>

            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input placeholder="请输入手机号" />
            </Form.Item>

            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入正确的邮箱格式' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              label="合同开始时间"
              name="contractStartDate"
              rules={[{ required: true, message: '请选择合同开始时间' }]}
            >
              <DatePicker 
                className="w-full" 
                placeholder="请选择合同开始时间"
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item
              label="合同到期时间"
              name="contractEndDate"
              rules={[{ required: true, message: '请选择合同到期时间' }]}
            >
              <DatePicker 
                className="w-full" 
                placeholder="请选择合同到期时间"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </div>

          <div className="mt-8 text-center">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              className="w-full md:w-auto px-8"
            >
              提交审核
            </Button>
          </div>

          <div className="mt-4 text-center text-gray-500 text-sm">
            <p>提交后您的资料将进入审核流程</p>
            <p>审核通过后即可正常使用系统</p>
          </div>
        </Form>
      </Card>
    </div>
  );
} 