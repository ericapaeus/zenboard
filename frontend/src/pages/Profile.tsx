import  { useState, useEffect, useCallback } from 'react';
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
import dayjs from 'dayjs';
import { authApi } from '@/services/api';
import FileUpload from '@/components/FileUpload';

interface ProfileData {
  id?: number;
  name: string;
  phone: string;
  email: string;
  hire_date?: string;
  contract_expiry?: string;
  avatar?: string;
  role?: string;
  status?: string;
}

export default function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    phone: '',
    email: '',
    hire_date: '',
    contract_expiry: '',
    avatar: '',
  });

  // 获取用户信息
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authApi.getCurrentUser();
      if (response.success) {
        const userData = response.data;
        setProfileData({
          id: userData.id,
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          hire_date: userData.hire_date || '',
          contract_expiry: userData.contract_expiry || '',
          avatar: userData.avatar || '',
          role: userData.role,
          status: userData.status,
        });
        
        // 更新表单初始值
        form.setFieldsValue({
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          hire_date: userData.hire_date ? dayjs(userData.hire_date) : null,
          contract_expiry: userData.contract_expiry ? dayjs(userData.contract_expiry) : null,
        });
      } else {
        message.error(response.message || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [form]); // 添加 form 作为依赖

  // 更新用户信息
  const updateUserProfile = async (values: ProfileData & { hire_date?: dayjs.Dayjs; contract_expiry?: dayjs.Dayjs }) => {
    setLoading(true);
    try {
      // 转换日期格式
      const formData = {
        name: values.name,
        phone: values.phone,
        email: values.email,
        hire_date: values.hire_date?.toDate(), // 转换为 Date 对象
        contract_expiry: values.contract_expiry?.toDate(), // 转换为 Date 对象
      };

      console.log('提交的数据:', formData);
      
      // 调用真实的 API 更新用户信息
      const response = await authApi.updateProfile(formData);
      
      if (response.success) {
        // 更新本地状态
        setProfileData(prev => ({
          ...prev,
          name: values.name,
          phone: values.phone,
          email: values.email,
          hire_date: values.hire_date?.format('YYYY-MM-DD'),
          contract_expiry: values.contract_expiry?.format('YYYY-MM-DD'),
        }));
        
      setEditing(false);
      message.success('个人资料更新成功！');
        
        // 更新 localStorage 中的用户信息
        const currentUserInfo = localStorage.getItem('userInfo');
        if (currentUserInfo) {
          const userInfo = JSON.parse(currentUserInfo);
          const updatedUserInfo = { 
            ...userInfo, 
            name: values.name,
            phone: values.phone,
            email: values.email,
            hire_date: values.hire_date?.format('YYYY-MM-DD'),
            contract_expiry: values.contract_expiry?.format('YYYY-MM-DD'),
          };
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        }
      } else {
        message.error(response.message || '更新失败，请重试');
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理头像上传成功
  const handleAvatarUploadSuccess = async (data: { url: string; filename: string; size: number; type: string }) => {
    console.log('头像上传成功，返回数据:', data);
    
    try {
      // 更新用户信息到后端
      const updateResponse = await authApi.updateProfile({
        avatar: data.url,
      });
      
      console.log('更新用户头像响应:', updateResponse);
      
      if (updateResponse.success) {
        // 更新本地状态
        setProfileData(prev => ({
          ...prev,
          avatar: data.url,
        }));
        
        // 更新 localStorage 中的用户信息
        const currentUserInfo = localStorage.getItem('userInfo');
        if (currentUserInfo) {
          const userInfo = JSON.parse(currentUserInfo);
          const updatedUserInfo = { ...userInfo, avatar: data.url };
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          console.log('已更新 localStorage 中的用户信息:', updatedUserInfo);
        }
        
        message.success('头像上传成功！');
      } else {
        console.error('头像更新失败:', updateResponse.message);
        message.error('头像更新失败，请重试');
      }
    } catch (error) {
      console.error('头像更新失败:', error);
      message.error('头像更新失败，请重试');
    }
  };

  // 处理头像上传错误
  const handleAvatarUploadError = (error: Error) => {
    console.error('头像上传错误:', error);
    message.error(error.message || '头像上传失败');
  };

  // 组件加载时获取用户信息
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]); // 依赖项中添加 fetchUserProfile

  // 处理表单提交
  const handleSubmit = async (values: ProfileData & { hire_date?: dayjs.Dayjs; contract_expiry?: dayjs.Dayjs }) => {
    await updateUserProfile(values);
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
                  src={profileData.avatar ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${profileData.avatar}` : undefined}
                  icon={<UserOutlined />}
                  className="mb-4"
                />
                <FileUpload
                  type="avatar"
                  onSuccess={handleAvatarUploadSuccess}
                  onError={handleAvatarUploadError}
                  accept="image/jpeg,image/png"
                  maxSize={2}
                  buttonText=""
                  buttonIcon={<CameraOutlined />}
                  className="absolute bottom-2 right-2 !p-0 !w-8 !h-8 !min-w-0"
                  />
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
                    label="入职时间"
                    name="hire_date"
                    rules={[{ required: true, message: '请选择入职时间' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      placeholder="请选择入职时间"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="合同到期时间"
                    name="contract_expiry"
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
                      // 重新获取用户信息以重置表单
                      fetchUserProfile();
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