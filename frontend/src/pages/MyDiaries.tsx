import React, { useState } from 'react';
import { DatePicker, Button, Space, Typography, Modal, Form, Radio, Select, Row, Col, message, List, Card, Input } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CommentEntry {
  id: string;
  author: string;
  date: string;
  content: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  type: string;
  content: string;
  members?: string[];
  status: 'draft' | 'submitted';
  comments?: CommentEntry[]; // Add comments field
}

const MyDiaries: React.FC = () => {
  const defaultStartDate = dayjs('2025-01-01');
  const defaultEndDate = dayjs(); // Current date

  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([defaultStartDate, defaultEndDate]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [diaryType, setDiaryType] = useState('public'); // Default to public
  const [drafts, setDrafts] = useState<DiaryEntry[]>([]); // To store drafts
  const [diaries, setDiaries] = useState<DiaryEntry[]>([ // To store submitted diaries
    {
      id: '1',
      date: '2025-07-20',
      type: 'public',
      content: '今天天气真好，适合出去散步。',
      status: 'submitted',
      comments: [],
    },
    {
      id: '2',
      date: '2025-07-18',
      type: 'project',
      content: '项目进展顺利，完成了模块A的开发。',
      status: 'submitted',
      comments: [],
    },
    {
      id: '3',
      date: '2025-07-15',
      type: 'private',
      content: '思考了一些个人问题，感觉豁然开朗。',
      status: 'submitted',
      comments: [],
    },
  ]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null); // To track which draft is being edited

  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewedDiary, setViewedDiary] = useState<DiaryEntry | null>(null);
  const [commentForm] = Form.useForm(); // Form for comments

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields(); // Reset form fields when modal opens
    setDiaryType('public'); // Reset diary type
    setEditingDraftId(null); // Not editing a draft initially
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSaveDraft = () => {
    form.validateFields().then(values => {
      const newDraft: DiaryEntry = {
        id: editingDraftId || String(Date.now()), // Use existing ID if editing, otherwise new ID
        date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        type: diaryType,
        content: values.content,
        members: values.members,
        status: 'draft',
      };

      if (editingDraftId) {
        // Update existing draft
        setDrafts(drafts.map(d => (d.id === editingDraftId ? newDraft : d)));
        message.success('草稿已更新！');
      } else {
        // Add new draft
        setDrafts([...drafts, newDraft]);
        message.success('草稿已保存！');
      }
      setIsModalVisible(false);
    }).catch(info => {
      console.log('Validate Failed:', info);
      message.error('请填写完整日记内容！');
    });
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const newDiary: DiaryEntry = {
        id: String(Date.now()),
        date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        type: diaryType,
        content: values.content,
        members: values.members,
        status: 'submitted',
      };
      setDiaries([...diaries, newDiary]);
      message.success('日记已提交！');
      setIsModalVisible(false);

      if (editingDraftId) {
        // Remove from drafts if it was a draft being submitted
        setDrafts(drafts.filter(d => d.id !== editingDraftId));
        setEditingDraftId(null);
      }
      // Here you would typically send the diary to the backend
    }).catch(info => {
      console.log('Validate Failed:', info);
      message.error('请填写完整日记内容！');
    });
  };

  const handleEditDraft = (draft: DiaryEntry) => {
    setIsModalVisible(true);
    setEditingDraftId(draft.id);
    setDiaryType(draft.type);
    form.setFieldsValue({
      date: dayjs(draft.date),
      type: draft.type,
      content: draft.content,
      members: draft.members,
    });
  };

  const handleViewDiary = (diary: DiaryEntry) => {
    setViewedDiary(diary);
    setIsViewModalVisible(true);
  };

  const handleViewModalCancel = () => {
    setIsViewModalVisible(false);
    setViewedDiary(null);
    commentForm.resetFields(); // Reset comment form fields
  };

  const handleAddComment = (diaryId: string, commentContent: string) => {
    const newComment: CommentEntry = {
      id: String(Date.now()),
      author: '当前用户', // Replace with actual user name
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      content: commentContent,
    };

    setDiaries(prevDiaries => {
      const updatedDiaries = prevDiaries.map(diary =>
        diary.id === diaryId
          ? { ...diary, comments: [...(diary.comments || []), newComment] }
          : diary
      );
      // Update viewedDiary if it's the one being commented on
      if (viewedDiary && viewedDiary.id === diaryId) {
        setViewedDiary(updatedDiaries.find(d => d.id === diaryId) || null);
      }
      return updatedDiaries;
    });
    message.success('评论已添加！');
    commentForm.resetFields(); // Clear comment input
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setSelectedDateRange([dates[0], dates[1]]);
    } else {
      // If dates are cleared, reset to default or handle as needed
      setSelectedDateRange([defaultStartDate, defaultEndDate]);
    }
  };

  const filteredDiaries = diaries.filter(diary => {
    const diaryDate = dayjs(diary.date);
    const [startDate, endDate] = selectedDateRange;
    return diaryDate.isSameOrAfter(startDate, 'day') && diaryDate.isSameOrBefore(endDate, 'day');
  });

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>我的日记</Title>
      <Space direction="vertical" size={12} style={{ marginBottom: 24 }}>
        <RangePicker
          value={selectedDateRange}
          onChange={handleDateRangeChange}
          format="YYYY-MM-DD"
        />
      </Space>
      <div style={{ marginBottom: 24 }}>
        <List
          header={<Title level={4}>日记列表</Title>}
          bordered
          dataSource={filteredDiaries} // Use filtered diaries
          renderItem={item => (
            <List.Item
              actions={[<Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDiary(item)}>查看</Button>]}
            >
              <List.Item.Meta
                title={<Text strong>{item.date} - {item.type}</Text>}
                description={<Paragraph ellipsis={{ rows: 1 }}>{item.content}</Paragraph>}
              />
            </List.Item>
          )}
        />
      </div>
      <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
        添加日记
      </Button>

      <div style={{ marginTop: 24, border: '1px solid #eee', padding: 16 }}>
        <Title level={4}>草稿箱</Title>
        {drafts.length === 0 ? (
          <p>暂无草稿</p>
        ) : (
          <List
            bordered
            dataSource={drafts}
            renderItem={item => (
              <List.Item
                actions={[<Button type="link" icon={<EditOutlined />} onClick={() => handleEditDraft(item)}>编辑</Button>]}
              >
                <List.Item.Meta
                  title={<Text strong>{item.date} - {item.type} (草稿)</Text>}
                  description={<Paragraph ellipsis={{ rows: 1 }}>{item.content}</Paragraph>}
                />
              </List.Item>
            )}
          />
        )}
      </div>

      <Modal
        title={editingDraftId ? "编辑日记草稿" : "添加日记"}
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
                <TextArea rows={8} placeholder="请输入日记内容..." />
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

      {/* View Diary Modal */}
      <Modal
        title="日记详情"
        visible={isViewModalVisible}
        onCancel={handleViewModalCancel}
        footer={null}
      >
        {viewedDiary && (
          <Card>
            <p><strong>日期:</strong> {viewedDiary.date}</p>
            <p><strong>类型:</strong> {viewedDiary.type}</p>
            {viewedDiary.members && viewedDiary.members.length > 0 && (
              <p><strong>指定成员:</strong> {viewedDiary.members.join(', ')}</p>
            )}
            <p><strong>内容:</strong></p>
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: 20 }}>
              {viewedDiary.content}
            </div>

            <Title level={5}>评论</Title>
            <List
              dataSource={viewedDiary.comments}
              renderItem={comment => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{comment.author} - {comment.date}</Text>}
                    description={comment.content}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无评论' }}
            />

            <Form
              form={commentForm} // Assign the comment form instance
              layout="vertical"
              onFinish={(values) => handleAddComment(viewedDiary.id, values.commentContent)}
              style={{ marginTop: 20 }}
            >
              <Form.Item name="commentContent" rules={[{ required: true, message: '请输入评论内容！' }]}>
                <TextArea rows={4} placeholder="请输入评论内容..." />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  添加评论
                </Button>
              </Form.Item>
            </Form>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default MyDiaries;
