import React from 'react';
import { List, Typography, Button, Modal, Form, Input, Select, Checkbox, Popconfirm, Space } from 'antd';
import { RightOutlined, PlusOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface Project {
  id: string;
  name: string;
  description: string;
  members?: string[]; // Add members field
}

// Mock user data for demonstration
const mockUsers = [
  { id: 'u1', name: '张三' },
  { id: 'u2', name: '李四' },
  { id: 'u3', name: '王五' },
  { id: 'u4', name: '赵六' },
];

const MyProjects: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalVisible, setIsCreateModalVisible] = React.useState(false);
  const [createForm] = Form.useForm();
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]); // State for selected projects
  const [isDeleteMode, setIsDeleteMode] = React.useState(false); // State for delete mode
  const [projects, setProjects] = React.useState<Project[]>([
    {
      id: 'p1',
      name: 'ZenBoard 后端开发',
      description: '负责 ZenBoard 项目的后端 API 设计与实现，包括用户认证、任务管理、项目管理等模块。',
    },
    {
      id: 'p2',
      name: 'ZenBoard 前端优化',
      description: '专注于 ZenBoard 用户界面的开发与优化，提升用户体验和响应速度。',
    },
    {
      id: 'p3',
      name: 'ZenBoard 数据库优化',
      description: '负责数据库结构设计、性能优化以及数据迁移工作，确保数据存储的高效与安全。',
    },
    {
      id: 'p4',
      name: 'ZenBoard UI/UX 设计',
      description: '负责 ZenBoard 产品的用户界面和用户体验设计，包括原型、线框图和最终视觉设计。',
    },
  ]);

  const handleViewProjectTasks = (projectId: string, projectName: string) => {
    navigate(`/projects/${projectId}/tasks`);
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
    const newProject: Project = {
      id: `p${Date.now()}`, // Simple unique ID
      name: values.name,
      description: values.description,
      members: values.members || [], // Include selected members
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
    message.success('项目创建成功！');
    handleCreateModalCancel();
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectIds(prevSelected =>
      prevSelected.includes(projectId)
        ? prevSelected.filter(id => id !== projectId)
        : [...prevSelected, projectId]
    );
  };

  const handleDeleteSelectedProjects = () => {
    setProjects(prevProjects =>
      prevProjects.filter(project => !selectedProjectIds.includes(project.id))
    );
    setSelectedProjectIds([]); // Clear selection after deletion
    setIsDeleteMode(false); // Exit delete mode after deletion
    message.success(`已删除 ${selectedProjectIds.length} 个项目！`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0">我的项目</Title>
        <Space>
          <Button
            type="default"
            danger={!isDeleteMode} // Red when not in delete mode, default when in delete mode
            onClick={() => {
              if (isDeleteMode) {
                setIsDeleteMode(false);
                setSelectedProjectIds([]); // Clear selection when exiting delete mode
              } else {
                setIsDeleteMode(true);
              }
            }}
          >
            {isDeleteMode ? '取消删除' : '删除项目'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateModalOpen}>
            创建项目
          </Button>
        </Space>
      </div>
      <List
        bordered
        dataSource={projects}
        renderItem={project => (
          <List.Item
            actions={[
              <Button type="link" onClick={() => handleViewProjectTasks(project.id, project.name)}>
                项目任务 <RightOutlined />
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={
                isDeleteMode && ( // Only render checkbox in delete mode
                  <Checkbox
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={() => handleSelectProject(project.id)}
                  />
                )
              }
              title={<Text strong>{project.name}</Text>}
              description={<Paragraph>{project.description}</Paragraph>}
            />
          </List.Item>
        )}
      />

      {isDeleteMode && (
        <div className="fixed bottom-5 right-5">
          <Popconfirm
            title="确定要删除选中的项目吗？"
            onConfirm={handleDeleteSelectedProjects}
            okText="是"
            cancelText="否"
            disabled={selectedProjectIds.length === 0}
          >
            <Button type="primary" danger size="large" disabled={selectedProjectIds.length === 0}>
              确认删除 ({selectedProjectIds.length})
            </Button>
          </Popconfirm>
        </div>
      )}


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
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="项目描述"
            rules={[{ required: true, message: '请输入项目描述！' }]}
          >
            <Input.TextArea rows={4} />
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

export default MyProjects;
