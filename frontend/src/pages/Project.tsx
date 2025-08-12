import React from 'react';
import { Card, Typography, Button, Modal, Form, Input, Select, Avatar, Tag, Space, Row, Col, Statistic, Pagination } from 'antd';
import { PlusOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, SearchOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

interface Project {
  id: string;
  name: string;
  description: string;
  members: string[];
  taskCount: number;
  completedTaskCount: number;
  color: string;
}

// Mock user data for demonstration
const mockUsers = [
  { id: 'u1', name: '张三', avatar: '张' },
  { id: 'u2', name: '李四', avatar: '李' },
  { id: 'u3', name: '王五', avatar: '王' },
  { id: 'u4', name: '赵六', avatar: '赵' },
];

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalVisible, setIsCreateModalVisible] = React.useState(false);
  const [createForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(8);
  const [filteredProjects, setFilteredProjects] = React.useState<Project[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([
    {
      id: 'p1',
      name: 'ZenBoard 后端开发',
      description: '负责 ZenBoard 项目的后端 API 设计与实现',
      members: ['u1', 'u2'],
      taskCount: 12,
      completedTaskCount: 8,
      color: '#1890ff',
    },
    {
      id: 'p2',
      name: 'ZenBoard 前端优化',
      description: '专注于 ZenBoard 用户界面的开发与优化',
      members: ['u2', 'u3'],
      taskCount: 8,
      completedTaskCount: 5,
      color: '#52c41a',
    },
    {
      id: 'p3',
      name: 'ZenBoard 数据库优化',
      description: '负责数据库结构设计、性能优化以及数据迁移工作',
      members: ['u1', 'u4'],
      taskCount: 6,
      completedTaskCount: 4,
      color: '#fa8c16',
    },
    {
      id: 'p4',
      name: 'ZenBoard UI/UX 设计',
      description: '负责 ZenBoard 产品的用户界面和用户体验设计',
      members: ['u3', 'u4'],
      taskCount: 10,
      completedTaskCount: 7,
      color: '#722ed1',
    },
    {
      id: 'p5',
      name: '移动端开发',
      description: '负责移动端应用的开发与维护',
      members: ['u1', 'u3'],
      taskCount: 15,
      completedTaskCount: 10,
      color: '#eb2f96',
    },
    {
      id: 'p6',
      name: '测试自动化',
      description: '建立自动化测试体系，提升代码质量',
      members: ['u2', 'u4'],
      taskCount: 9,
      completedTaskCount: 6,
      color: '#13c2c2',
    },
    {
      id: 'p7',
      name: 'DevOps 部署',
      description: '负责持续集成和部署流程的优化',
      members: ['u1', 'u2', 'u3'],
      taskCount: 7,
      completedTaskCount: 4,
      color: '#fa541c',
    },
    {
      id: 'p8',
      name: '性能监控',
      description: '建立系统性能监控和告警机制',
      members: ['u3', 'u4'],
      taskCount: 11,
      completedTaskCount: 8,
      color: '#a0d911',
    },
  ]);

  // 搜索和筛选功能
  const handleSearch = (values: any) => {
    let filtered = [...projects];
    
    // 关键词搜索
    if (values.keyword) {
      const keyword = values.keyword.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(keyword) ||
        project.description.toLowerCase().includes(keyword)
      );
    }
    
    // 成员筛选
    if (values.member && values.member !== 'all') {
      filtered = filtered.filter(project => 
        project.members.includes(values.member)
      );
    }
    
    setFilteredProjects(filtered);
    setCurrentPage(1); // 重置到第一页
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setFilteredProjects(projects);
    setCurrentPage(1);
  };

  // 初始化筛选结果
  React.useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  const handleViewProjectDetails = (projectId: string, projectName: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleCreateModalOpen = () => {
    setIsCreateModalVisible(true);
    createForm.resetFields();
  };

  const handleCreateModalCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  const handleCreateProject = async (values: any) => {
    const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newProject: Project = {
      id: `p${Date.now()}`,
      name: values.name,
      description: values.description,
      members: values.members || [],
      taskCount: 0,
      completedTaskCount: 0,
      color: randomColor,
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
    message.success('项目创建成功！');
    handleCreateModalCancel();
  };

  const getMemberNames = (memberIds: string[]) => {
    return mockUsers
      .filter(user => memberIds.includes(user.id))
      .map(user => user.name);
  };

  const getMemberAvatars = (memberIds: string[]) => {
    return mockUsers
      .filter(user => memberIds.includes(user.id))
      .map(user => ({ name: user.name, avatar: user.avatar }));
  };

  // 计算分页数据
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

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
                  placeholder="搜索项目名称或描述"
                  prefix={<SearchOutlined className="text-gray-400" />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="member" className="w-full mb-0">
                <Select placeholder="选择成员" allowClear>
                  <Option value="all">全部成员</Option>
                  {mockUsers.map(user => (
                    <Option key={user.id} value={user.id}>{user.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={12}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<SearchOutlined />}>
                  重置
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleCreateModalOpen}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  添加
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        {currentProjects.map(project => (
          <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
            <Card
              hoverable
              className="h-full"
              style={{ borderTop: `4px solid ${project.color}` }}
              actions={[
                <Button 
                  type="link" 
                  onClick={() => handleViewProjectDetails(project.id, project.name)}
                  icon={<TeamOutlined />}
                >
                  查看详情
                </Button>
              ]}
            >
              <div className="mb-4">
                <Title level={4} className="mb-2" style={{ color: project.color }}>
                  {project.name}
                </Title>
                <Text type="secondary" className="text-sm">
                  {project.description}
                </Text>
              </div>

              {/* 任务统计 */}
              <div className="mb-4">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="总任务"
                      value={project.taskCount}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="已完成"
                      value={project.completedTaskCount}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                    />
                  </Col>
                </Row>
                {project.taskCount > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>进度</span>
                      <span>{Math.round((project.completedTaskCount / project.taskCount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(project.completedTaskCount / project.taskCount) * 100}%`,
                          backgroundColor: project.color
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 成员列表 */}
              <div>
                <Text strong className="text-sm mb-2 block">项目成员</Text>
                <div className="flex items-center gap-2">
                  <Avatar.Group maxCount={3} size="small">
                    {getMemberAvatars(project.members).map((member, index) => (
                      <Avatar 
                        key={index} 
                        style={{ backgroundColor: project.color }}
                        size="small"
                      >
                        {member.avatar}
                      </Avatar>
                    ))}
                  </Avatar.Group>
                  {project.members.length > 0 && (
                    <Text type="secondary" className="text-xs">
                      {getMemberNames(project.members).join('、')}
                    </Text>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 分页 */}
      <div className="flex justify-center mt-8">
        <Pagination
          current={currentPage}
          total={filteredProjects.length}
          pageSize={pageSize}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
        />
      </div>

      {/* Create Project Modal */}
      <Modal
        title="创建新项目"
        visible={isCreateModalVisible}
        onCancel={handleCreateModalCancel}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateProject}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称！' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="项目描述"
            rules={[{ required: true, message: '请输入项目描述！' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item
            name="members"
            label="项目成员"
          >
            <Select
              mode="multiple"
              placeholder="请选择项目成员"
              options={mockUsers.map(user => ({ value: user.id, label: user.name }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建项目
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
