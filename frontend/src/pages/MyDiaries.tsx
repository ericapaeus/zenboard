import React, { useState } from 'react';
import { DatePicker, Button, Space, Typography, Modal, Form, Input, Radio, Select, Row, Col, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MyDiaries: React.FC = () => {
  const defaultStartDate = dayjs('2025-01-01');
  const defaultEndDate = dayjs(); // Current date

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [diaryType, setDiaryType] = useState('public'); // Default to public
  const [drafts, setDrafts] = useState<any[]>([]); // To store drafts

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields(); // Reset form fields when modal opens
    setDiaryType('public'); // Reset diary type
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSaveDraft = () => {
    form.validateFields().then(values => {
      const newDraft = { ...values, date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'), type: diaryType, status: 'draft' };
      setDrafts([...drafts, newDraft]);
      message.success('草稿已保存！');
      setIsModalVisible(false);
    }).catch(info => {
      console.log('Validate Failed:', info);
      message.error('请填写完整日记内容！');
    });
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const newDiary = { ...values, date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'), type: diaryType, status: 'submitted' };
      console.log('提交日记:', newDiary);
      message.success('日记已提交！');
      setIsModalVisible(false);
      // Here you would typically send the diary to the backend
    }).catch(info => {
      console.log('Validate Failed:', info);
      message.error('请填写完整日记内容！');
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>我的日记</Title>
      <Space direction="vertical" size={12} style={{ marginBottom: 24 }}>
        <RangePicker
          defaultValue={[defaultStartDate, defaultEndDate]}
          format="YYYY-MM-DD"
        />
      </Space>
      <div style={{ minHeight: 300, border: '1px dashed #ccc', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
        <p>日记列表区域</p>
      </div>
      <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
        添加日记
      </Button>

      <div style={{ marginTop: 24, border: '1px solid #eee', padding: 16 }}>
        <Title level={4}>草稿箱</Title>
        {drafts.length === 0 ? (
          <p>暂无草稿</p>
        ) : (
          <ul>
            {drafts.map((draft, index) => (
              <li key={index}>
                {draft.date} - {draft.type} - {draft.content.substring(0, 30)}...
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        title="添加日记"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null} // Custom footer for buttons
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ date: dayjs(), type: 'public' }}
        >
          <Form.Item name="date" style={{ textAlign: 'center' }}>
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="选择日记类型" name="type">
                <Radio.Group onChange={(e) => setDiaryType(e.target.value)} value={diaryType}>
                  <Space direction="vertical">
                    <Radio value="public">公开日记</Radio>
                    <Radio value="project">项目日记</Radio>
                    <Radio value="assigned">指定日记</Radio>
                    <Radio value="private">私人日记</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
              {diaryType === 'assigned' && (
                <Form.Item label="选择成员" name="members">
                  <Select mode="multiple" placeholder="请选择成员">
                    <Option value="member1">成员A</Option>
                    <Option value="member2">成员B</Option>
                    <Option value="member3">成员C</Option>
                  </Select>
                </Form.Item>
              )}
            </Col>
            <Col span={16}>
              <Form.Item label="日记内容" name="content" rules={[{ required: true, message: '请输入日记内容！' }]}>
                <TextArea rows={10} placeholder="请输入日记内容" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button onClick={handleSaveDraft}>保留为草稿</Button>
              <Button type="primary" onClick={handleSubmit}>提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyDiaries;
