import React from 'react';
import { Card, Row, Col, Button, Form, Input, Switch, Select, Space } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';

export default function SystemConfig() {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('系统配置:', values);
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">系统配置</h1>
        <p className="text-gray-500 mt-1">管理系统设置和参数配置</p>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            title="基本设置" 
            extra={
              <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
                保存设置
              </Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                siteName: 'ZenBoard',
                siteDescription: '高效的项目管理和团队协作平台',
                enableNotifications: true,
                enableEmailNotifications: false,
                language: 'zh-CN',
                timezone: 'Asia/Shanghai'
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="系统名称"
                    name="siteName"
                    rules={[{ required: true, message: '请输入系统名称' }]}
                  >
                    <Input placeholder="请输入系统名称" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="系统描述"
                    name="siteDescription"
                  >
                    <Input placeholder="请输入系统描述" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="系统语言"
                    name="language"
                  >
                    <Select>
                      <Select.Option value="zh-CN">中文</Select.Option>
                      <Select.Option value="en-US">English</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="时区设置"
                    name="timezone"
                  >
                    <Select>
                      <Select.Option value="Asia/Shanghai">Asia/Shanghai</Select.Option>
                      <Select.Option value="UTC">UTC</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="启用通知"
                    name="enableNotifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="启用邮件通知"
                    name="enableEmailNotifications"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="系统信息">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">版本号</span>
                <span className="font-medium">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">构建时间</span>
                <span className="font-medium">2025-01-08</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">运行环境</span>
                <span className="font-medium">Production</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 