import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  DatePicker,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Radio,
  Select,
  Row,
  Col,
  message,
  List,
  Card,
  Input,
  Pagination,
  Tag,
  Avatar,
} from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  useDocuments, 
  useCreateDocument, 
  useUpdateDocument, 
  useDeleteDocument, 
  useDocumentComments, 
  useAddComment,
  useFetchDocumentComments,
  type Document,
  type DocumentComment
} from '@/hooks/useApi';

// Markdown normalize so titles/lists render correctly even without space
function normalizeMarkdown(text: string): string {
  const normalized = (text || '').replace(/\r\n/g, '\n');
  return normalized
    .split('\n')
    .map((line) => {
      let l = line;
      l = l.replace(/^(#{1,6})(?!\s|#)/, '$1 ');
      l = l.replace(/^([*\-+])(?!\s)/, '$1 ');
      l = l.replace(/^(\d+\.)(?!\s)/, '$1 ');
      l = l.replace(/^(>)(?!\s)/, '> ');
      return l;
    })
    .join('\n');
}

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const visibilityTagColor: Record<DiaryEntry['type'], string> = {
  public: 'green',
  project: 'blue',
  assigned: 'purple',
  private: 'red',
};

type Visibility = Document['visibility'];
function mapTypeToVisibility(t: DiaryEntry['type']): Visibility {
  return t === 'assigned' ? 'specific' : (t as any);
}
function mapVisibilityToType(v: Visibility): DiaryEntry['type'] {
  return v === 'specific' ? 'assigned' : (v as any);
}

interface DiaryEntry {
  id: number;
  date: string; // 创建时间
  type: 'public' | 'project' | 'assigned' | 'private';
  title?: string;
  content: string;
  members?: string[];
  status: 'draft' | 'submitted';
  comments?: DocumentComment[];
}

const DocumentPage: React.FC = () => {
  const defaultStartDate = dayjs('2025-01-01');
  const defaultEndDate = dayjs();

  const [selectedDateRange, setSelectedDateRange] = useState<[
    dayjs.Dayjs,
    dayjs.Dayjs
  ]>([defaultStartDate, defaultEndDate]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [diaryType, setDiaryType] = useState<'public' | 'project' | 'assigned' | 'private'>('public');
  const [drafts, setDrafts] = useState<DiaryEntry[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingForDiaries, setEditingForDiaries] = useState<boolean>(false);

  // inline viewer state removed; comments handled per item
  const [commentForm] = Form.useForm();
  const contentPreview: string = Form.useWatch('content', form);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState<DiaryEntry | null>(null);
  const [commentsData, setCommentsData] = useState<Record<number, DocumentComment[]>>({});

  // 使用 hooks
  const searchFormValues = searchForm.getFieldsValue();
  const type = searchFormValues?.type as DiaryEntry['type'] | undefined;
  const visibility = type ? mapTypeToVisibility(type) : undefined;
  
  const { 
    data: documentsData, 
    loading: documentsLoading, 
    error: documentsError, 
    refetch: refetchDocuments 
  } = useDocuments({
    skip: (currentPage - 1) * pageSize,
    limit: pageSize,
    visibility,
    order_by: '-id'
  });

  const { createDocument, loading: createLoading } = useCreateDocument();
  const { updateDocument, loading: updateLoading } = useUpdateDocument();
  const { deleteDocument, loading: deleteLoading } = useDeleteDocument();
  const { addComment, loading: addCommentLoading } = useAddComment();
  const { fetchComments, loading: fetchCommentsLoading } = useFetchDocumentComments();

  // 获取单个文档评论的 hook
  const getDocumentComments = useCallback(async (documentId: number) => {
    try {
      const comments = await fetchComments(documentId);
      setCommentsData(prev => ({
        ...prev,
        [documentId]: comments
      }));
      return comments;
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }, [fetchComments]);

  // 转换文档数据为 DiaryEntry 格式
  const diaries = useMemo(() => {
    if (!documentsData) return [];
    const mappedData = documentsData.map(mapDoc);
    // 确保按照 id 倒序排序（最新的在前）
    return mappedData.sort((a, b) => b.id - a.id);
  }, [documentsData]);

  // 处理文档错误
  useEffect(() => {
    if (documentsError) {
      console.error('获取文档列表失败:', documentsError);
      message.error('获取文档列表失败: ' + documentsError);
    }
  }, [documentsError]);

  // 更新总数
  useEffect(() => {
    if (documentsData) {
      // 这里应该从 API 响应中获取总数，暂时使用数组长度
      setTotal(documentsData.length);
    }
  }, [documentsData]);

  function mapDoc(doc: Document): DiaryEntry {
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      type: mapVisibilityToType(doc.visibility),
      date: dayjs(doc.created_at).format('YYYY-MM-DD HH:mm:ss'), // 格式化时间
      status: 'submitted',
      comments: [],
    };
  }

  // 加载文档列表
  const loadDocuments = useCallback(async (page = currentPage, size = pageSize) => {
    setCurrentPage(page);
    setPageSize(size);
    // 折叠所有展开的列表项，因为数据已经变化
    setExpandedIds(new Set());
    // 数据加载由 useDocuments hook 自动处理
  }, [currentPage, pageSize]);

  // Filtering helper（基于当前页本地过滤：标题、日期）
  function applyFilters(list: DiaryEntry[], values: any) {
    const [startDate, endDate] = selectedDateRange;
    let result = list.filter((diary) => {
      const diaryDate = dayjs(diary.date);
      return (
        diaryDate.isSameOrAfter(startDate, 'day') &&
        diaryDate.isSameOrBefore(endDate, 'day')
      );
    });

    if (values?.keyword) {
      const kw = String(values.keyword).toLowerCase();
      result = result.filter((d) => (d.title || '').toLowerCase().includes(kw));
    }
    if (values?.type && values.type !== 'all') {
      result = result.filter((d) => d.type === values.type);
    }
    if (values?.member && values.member !== 'all') {
      result = result.filter((d) => (d.members || []).includes(values.member));
    }
    return result;
  }

  const [filteredDiaries, setFilteredDiaries] = useState<DiaryEntry[]>([]);

  // Keep form's dateRange synced with state
  useEffect(() => {
    searchForm.setFieldsValue({ dateRange: selectedDateRange });
  }, [searchForm, selectedDateRange]);

  // 初始化加载与依赖变化时刷新
  useEffect(() => {
    loadDocuments(1, pageSize);
  }, [loadDocuments, pageSize]);

  // 当筛选条件/数据变化时，做本地过滤
  useEffect(() => {
    const values = searchForm.getFieldsValue();
    setFilteredDiaries(applyFilters(diaries, values));
  }, [diaries, selectedDateRange]);

  const handleSearch = useCallback((values: any) => {
    // 获取可见性筛选条件
    const type = values?.type as DiaryEntry['type'] | undefined;
    const visibility = type ? mapTypeToVisibility(type) : undefined;
    
    // 更新分页参数，触发重新加载
    setCurrentPage(1);
    // 折叠所有展开的列表项
    setExpandedIds(new Set());
    // 重新获取文档列表
    refetchDocuments();
    // 同步做本地过滤
    setFilteredDiaries(applyFilters(diaries, values));
  }, [diaries, refetchDocuments]);

  const handleReset = useCallback(() => {
    searchForm.resetFields();
    setSelectedDateRange([defaultStartDate, defaultEndDate]);
    // 折叠所有展开的列表项
    setExpandedIds(new Set());
    // 重新获取文档列表
    refetchDocuments();
    // 重置到第一页
    setCurrentPage(1);
  }, [searchForm, refetchDocuments]);

  const showModal = useCallback(() => {
    setIsModalOpen(true);
    form.resetFields();
    setDiaryType('public');
    setEditingDraftId(null);
    setEditingForDiaries(false);
    // default values
    form.setFieldsValue({ type: 'public', content: '', title: '' });
  }, [form]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSaveDraft = useCallback(() => {
    form
      .validateFields()
      .then((values) => {
        const newDraft: DiaryEntry = {
          id: Date.now(),
          date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          type: diaryType,
          title: values.title,
          content: values.content,
          members: values.members,
          status: 'draft',
        };

        if (editingDraftId) {
          setDrafts(drafts.map((d) => (d.id === editingDraftId ? newDraft : d)));
          message.success('草稿已更新');
        } else {
          setDrafts([...drafts, newDraft]);
          message.success('草稿已保存');
        }
        setIsModalOpen(false);
      })
      .catch(() => {
        message.error('请填写完整内容');
      });
  }, [form, diaryType, editingDraftId, drafts]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      
      if (editingDraftId) {
        if (editingForDiaries) {
          // 更新文档
          await updateDocument(editingDraftId, {
            title: values.title,
            content: values.content,
            visibility: mapTypeToVisibility(diaryType),
          });
          setIsModalOpen(false);
          setEditingDraftId(null);
          setEditingForDiaries(false);
          refetchDocuments();
        } else {
          // 编辑草稿（本地）
          setDrafts((prev) =>
            prev.map((d) =>
              d.id === editingDraftId
                ? {
                    ...d,
                    type: diaryType,
                    title: values.title,
                    content: values.content,
                    members: values.members,
                  }
                : d,
            ),
          );
          message.success('草稿已更新');
          setIsModalOpen(false);
          setEditingDraftId(null);
        }
      } else {
        // 新建文档
        await createDocument({
          title: values.title || '无标题',
          content: values.content,
          visibility: mapTypeToVisibility(diaryType),
        });
        setIsModalOpen(false);
        // 重新获取文档列表，确保显示最新数据
        refetchDocuments();
        // 重置到第一页
        setCurrentPage(1);
      }
    } catch (error: any) {
      if (error.message) {
        message.error(error.message);
      } else {
        message.error('请填写完整内容');
      }
    }
  }, [form, editingDraftId, editingForDiaries, diaryType, updateDocument, createDocument, refetchDocuments, loadDocuments, pageSize]);

  const handleEditDraft = useCallback((draft: DiaryEntry) => {
    setIsModalOpen(true);
    setEditingDraftId(draft.id);
    setEditingForDiaries(false);
    setDiaryType(draft.type);
    form.setFieldsValue({
      type: draft.type,
      title: draft.title,
      content: draft.content,
      members: draft.members,
    });
  }, [form]);

  const handleEditDiary = useCallback((item: DiaryEntry) => {
    setIsModalOpen(true);
    setEditingDraftId(item.id);
    setEditingForDiaries(true);
    setDiaryType(item.type);
    form.setFieldsValue({ type: item.type, title: item.title, content: item.content, members: item.members });
  }, [form]);

  const handleDeleteDiary = useCallback((item: DiaryEntry) => {
    console.log('🔥 删除函数被调用 - handleDeleteDiary', {
      item: item,
      itemId: item.id,
      itemTitle: item.title,
      timestamp: new Date().toISOString()
    });

    console.log('📋 设置删除确认Modal状态');
    setDeleteTargetItem(item);
    setDeleteConfirmModalOpen(true);
  }, []);

  const handleAddComment = useCallback(async (diaryId: number, commentContent: string) => {
    try {
      await addComment({ document_id: diaryId, content: commentContent });
      commentForm.resetFields();
      
      // 重新加载评论列表
      try {
        await getDocumentComments(diaryId);
      } catch (error) {
        console.error('重新加载评论失败:', error);
      }
    } catch (error) {
      console.error('添加评论失败:', error);
    }
  }, [addComment, commentForm, getDocumentComments]);

  // 展开/折叠，并在首次展开时加载评论
  const toggleExpand = useCallback(async (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      } else {
        next.add(id);
        return next;
      }
    });
    
    // 检查是否已经展开，如果是首次展开则加载评论
    const isExpanding = !expandedIds.has(id);
    if (isExpanding) {
      const target = diaries.find((d) => d.id === id);
      if (target && (!commentsData[id] || commentsData[id].length === 0)) {
        try {
          // 使用 hook 获取评论
          await getDocumentComments(id);
        } catch (error) {
          // 错误已在 hook 中处理
        }
      }
    }
  }, [expandedIds, diaries, commentsData, getDocumentComments]);

  const handleDateRangeChange = useCallback((
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
  ) => {
    if (dates && dates[0] && dates[1]) {
      setSelectedDateRange([dates[0], dates[1]]);
    } else {
      setSelectedDateRange([defaultStartDate, defaultEndDate]);
    }
  }, [defaultStartDate, defaultEndDate]);

  // 当前页数据（先按服务器分页，再做本地筛选）
  const currentDiaries = useMemo(() => {
    const values = searchForm.getFieldsValue();
    return applyFilters(diaries, values);
  }, [diaries, selectedDateRange, searchForm]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetItem) return;
    
    try {
      console.log('🚀 开始执行删除API调用', {
        documentId: deleteTargetItem.id,
        apiFunction: 'documentApi.deleteDocument',
        timestamp: new Date().toISOString()
      });

      await deleteDocument(deleteTargetItem.id);
      
      console.log('✅ 删除成功，准备刷新列表', {
        currentPage,
        pageSize,
        timestamp: new Date().toISOString()
      });

      refetchDocuments();
      
      // 关闭Modal
      setDeleteConfirmModalOpen(false);
      setDeleteTargetItem(null);

      console.log('🔄 删除完成，列表刷新调用完毕');

    } catch (error: any) {
      console.error('💥 删除过程中发生错误', {
        error: error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        documentId: deleteTargetItem.id,
        timestamp: new Date().toISOString()
      });
      
      message.error(`删除失败: ${error?.message || '未知错误'}`);
    }
  }, [deleteTargetItem, deleteDocument, currentPage, pageSize, refetchDocuments]);

  const handleCancelDelete = useCallback(() => {
    console.log('🚫 用户取消删除操作', {
      documentId: deleteTargetItem?.id,
      timestamp: new Date().toISOString()
    });
    setDeleteConfirmModalOpen(false);
    setDeleteTargetItem(null);
  }, [deleteTargetItem]);

  // Compute member options from data
  const memberOptions = useMemo(() => {
    const setIds = new Set<string>();
    diaries.forEach((d) => (d.members || []).forEach((m) => setIds.add(m)));
    return Array.from(setIds).map((m) => ({ label: m, value: m }));
  }, [diaries]);

  return (
    <div style={{ padding: 24 }}>
      {/* 搜索区域（包含时间范围） */}
      <Card className="mb-6 shadow-sm">
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          className="w-full"
          initialValues={{ dateRange: selectedDateRange }}
        >
          <Row gutter={[8, 8]} wrap align="middle">
            <Col flex="none">
              <Form.Item name="dateRange" style={{ marginBottom: 0 }}>
                <RangePicker
                  value={selectedDateRange}
                  onChange={handleDateRangeChange}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col flex="none">
              <Form.Item name="keyword" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="搜索标题"
                  allowClear
                  style={{ width: 260 }}
                  prefix={<SearchOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col flex="none">
              <Form.Item name="type" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="选择可见性"
                  allowClear
                  style={{ width: 140 }}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '公开', value: 'public' },
                    { label: '项目', value: 'project' },
                    { label: '指定', value: 'assigned' },
                    { label: '私有', value: 'private' },
                  ]}
                />
              </Form.Item>
            </Col>
            {memberOptions.length > 0 && (
              <Col flex="none">
                <Form.Item name="member" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="选择成员"
                    allowClear
                    style={{ width: 160 }}
                    options={[{ label: '全部', value: 'all' }, ...memberOptions]}
                  />
                </Form.Item>
              </Col>
            )}
            <Col flex="none">
              <Space size={8}>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<SearchOutlined />}>
                  重置
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                  添加
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 卡片网格列表（支持展开/折叠，内联 Markdown 与评论） */}
      <div style={{ marginBottom: 24 }}>
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
          dataSource={currentDiaries}
          loading={documentsLoading}
          renderItem={(item) => {
            const expanded = expandedIds.has(item.id);
            return (
              <List.Item>
                <Card
                  hoverable
                  style={{ borderRadius: 8, height: '100%' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, minWidth: 0 }}>
                          {item.title || '无标题'}
                        </Text>
                        <Tag color={visibilityTagColor[item.type]}>{item.type}</Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
                    </div>
                    <Space>
                      <Button type="link" onClick={() => handleEditDiary(item)}>编辑</Button>
                      <Button type="link" danger onClick={() => {
                        console.log('🖱️ 删除按钮被点击', {
                          item: item,
                          itemId: item.id,
                          itemTitle: item.title,
                          timestamp: new Date().toISOString()
                        });
                        handleDeleteDiary(item);
                      }}>删除</Button>
                      <Button type="link" onClick={() => toggleExpand(item.id)}>{expanded ? '收起' : '展开'}</Button>
                    </Space>
                  </div>

                  {!expanded && (
                    <Paragraph style={{ marginTop: 8 }} ellipsis={{ rows: 3 }}>
                      {item.content}
                    </Paragraph>
                  )}

                  {expanded && (
                    <div style={{ marginTop: 12 }}>
                      <Card size="small" style={{ marginBottom: 12 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {normalizeMarkdown(item.content)}
                        </ReactMarkdown>
                      </Card>

                      <Title level={5} style={{ marginTop: 0 }}>评论</Title>
                      <List
                        dataSource={commentsData[item.id] || []}
                        locale={{ emptyText: '暂无评论' }}
                        renderItem={(c) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  src={c.author_avatar ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${c.author_avatar}` : undefined}
                                  icon={!c.author_avatar ? <UserOutlined /> : undefined}
                                  size="small"
                                  className={!c.author_avatar ? "bg-gradient-to-br from-blue-500 to-purple-600" : ""}
                                />
                              }
                              title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Text strong>{c.author_name || `用户${c.author_id}`}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>#{c.id}</Text>
                                </div>
                              }
                              description={
                                <Card size="small">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {normalizeMarkdown(c.content)}
                                  </ReactMarkdown>
                                  <div style={{ marginTop: 6 }}>
                                    <Text type="secondary">{dayjs(c.created_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
                                  </div>
                                </Card>
                              }
                            />
                          </List.Item>
                        )}
                      />

                      <Space.Compact style={{ width: '100%', marginTop: 12 }}>
                        <TextArea
                          rows={3}
                          placeholder="输入评论，支持 Markdown"
                          value={commentInputs[item.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                        />
                      </Space.Compact>
                      <div style={{ textAlign: 'right', marginTop: 8 }}>
                        <Button 
                          type="primary" 
                          loading={addCommentLoading}
                          onClick={async () => {
                            const content = (commentInputs[item.id] || '').trim();
                            if (!content) { message.error('请输入评论内容'); return; }
                            await handleAddComment(item.id, content);
                            setCommentInputs(prev => ({ ...prev, [item.id]: '' }));
                          }}
                        >
                          添加评论
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </List.Item>
            );
          }}
        />
      </div>

      {/* 分页 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <Pagination
          current={currentPage}
          total={total}
          pageSize={pageSize}
          showSizeChanger
          showQuickJumper
          showTotal={(t, range) => `第 ${range[0]}-${range[1]} 条，共 ${t} 条`}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size || pageSize);
            // 折叠所有展开的列表项
            setExpandedIds(new Set());
            loadDocuments(page, size || pageSize);
          }}
        />
      </div>

      {/* Create / Edit Modal with Markdown editor */}
      <Modal 
        title={editingDraftId ? '编辑' : '添加'} 
        open={isModalOpen} 
        onCancel={handleCancel} 
        footer={null} 
        width={900}
        confirmLoading={createLoading || updateLoading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'public', content: '', title: '' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="选择类型" name="type">
                <Radio.Group
                  onChange={(e) => setDiaryType(e.target.value)}
                  value={diaryType}
                >
                  <Space direction="vertical">
                    <Radio value="public">公开文档</Radio>
                    <Radio value="project">项目文档</Radio>
                    <Radio value="assigned">指定文档</Radio>
                    <Radio value="private">私人文档</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
              {diaryType === 'assigned' && (
                <Form.Item label="选择成员" name="members">
                  <Select
                    mode="multiple"
                    placeholder="请选择成员"
                    options={[
                      { label: '成员A', value: 'member1' },
                      { label: '成员B', value: 'member2' },
                      { label: '成员C', value: 'member3' },
                    ]}
                  />
                </Form.Item>
              )}
            </Col>
            <Col span={16}>
              <Form.Item label="标题" name="title">
                <Input placeholder="请输入标题（可选）" />
              </Form.Item>
              <Form.Item
                label="内容"
                name="content"
                rules={[{ required: true, message: '请输入内容！' }]}
              >
                <TextArea rows={10} placeholder="支持 Markdown 语法" />
              </Form.Item>
              <Card size="small" title="预览">
                <div
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                    padding: 12,
                    backgroundColor: '#fafafa',
                    minHeight: 120,
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {normalizeMarkdown(contentPreview || '')}
                  </ReactMarkdown>
                </div>
              </Card>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" onClick={handleSubmit} loading={createLoading || updateLoading}>
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认 Modal */}
      <Modal
        title="确认删除"
        open={deleteConfirmModalOpen}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteLoading}
        centered
        destroyOnClose
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: 16 }}>
            确定要删除以下文档吗？此操作不可逆。
          </p>
          {deleteTargetItem && (
            <div style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 6,
              border: '1px solid #d9d9d9'
            }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>标题：</Text>
                <Text>{deleteTargetItem.title || '无标题'}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text strong>类型：</Text>
                <Tag color={visibilityTagColor[deleteTargetItem.type]}>
                  {deleteTargetItem.type}
                </Tag>
              </div>
              <div>
                <Text strong>创建时间：</Text>
                <Text type="secondary">{deleteTargetItem.date}</Text>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DocumentPage; 