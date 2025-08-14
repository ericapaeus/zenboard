import React from 'react';
import { Card, Typography, Button, Modal, Form, Input, Select, Avatar, Tag, Space, Row, Col, Statistic, Pagination, Dropdown, message } from 'antd';
import { PlusOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, SearchOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { generateProjectColor } from '@/utils/colorGenerator';
// 导入 API hooks
import { 
  useProjects, 
  useAuthUsers, 
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useCreateMessage
} from '@/hooks/useApi';
import type { 
  Project, 
  User, 
  ProjectWithMembers, 
  CreateProjectData, 
  UpdateProjectData 
} from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

// 获取当前用户ID的辅助函数
const getCurrentUserId = (): number | undefined => {
  const currentUserInfo = localStorage.getItem('userInfo');
  if (currentUserInfo) {
    try {
      const userInfo = JSON.parse(currentUserInfo);
      return userInfo.id ? Number(userInfo.id) : undefined;
    } catch (e) {
      console.error('解析用户信息失败:', e);
      return undefined;
    }
  }
  return undefined;
};

const Projects: React.FC = () => {
  const [isCreateModalVisible, setIsCreateModalVisible] = React.useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(8);
  const [filteredProjects, setFilteredProjects] = React.useState<ProjectWithMembers[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<ProjectWithMembers | null>(null);

  // 调试：输出当前用户信息
  React.useEffect(() => {
    const currentUserId = getCurrentUserId();
    const userInfo = localStorage.getItem('userInfo');
    console.log('当前用户信息:', {
      currentUserId,
      userInfo: userInfo ? JSON.parse(userInfo) : null
    });
  }, []);

  // 使用 API hooks 获取数据
  const { data: projectsData, loading: projectsLoading, refetch: refetchProjects } = useProjects();
  const { data: usersData, loading: usersLoading } = useAuthUsers();
  const { createProject, loading: createLoading } = useCreateProject();
  const { updateProject, loading: updateLoading } = useUpdateProject();
  const { deleteProject, loading: deleteLoading } = useDeleteProject();
  const { createMessage, loading: messageLoading } = useCreateMessage();

  // 转换后端数据为前端格式
  const projects = React.useMemo(() => {
    if (!projectsData) return [];
    
    console.log('原始项目数据:', projectsData);
    
    return projectsData.map((project: any) => {
      console.log('处理项目:', {
        id: project.id,
        name: project.name,
        created_by: project.created_by,
        created_by_id: project.created_by_id
      });
      
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status || 'active',
        created_by: project.created_by,
        created_at: project.created_at,
        updated_at: project.updated_at,
        user_ids: project.user_ids || [],
        task_count: project.task_count || 0,
        subtask_count: project.subtask_count || 0,
        // 修复：使用 created_by 作为创建者ID
        creator_id: project.created_by ? Number(project.created_by) : undefined
      };
    });
  }, [projectsData]);

  // 从 API 获取用户选项
  const userOptions = React.useMemo(() => {
    if (!usersData) return [];
    return usersData.map(user => ({
      label: user.name || `用户${user.id}`,
      value: user.id
    }));
  }, [usersData]);

  // 检查当前用户是否有权限编辑或删除项目
  const canUserEditProject = (project: ProjectWithMembers): boolean => {
    const currentUserId = getCurrentUserId();
    console.log('项目权限检查调试信息:', {
      currentUserId,
      projectCreatorId: project.creator_id,
      projectCreatedBy: project.created_by,
      projectName: project.name,
      usersData: usersData?.length
    });
    
    if (!currentUserId) {
      console.log('当前用户ID不存在');
      return false;
    }
    
    // 项目创建者可以编辑和删除 - 直接比较ID
    if (project.creator_id === currentUserId) {
      console.log('用户是项目创建者，允许编辑');
      return true;
    }
    
    // 如果项目有创建者信息，通过created_by字段查找用户ID
    if (project.created_by && usersData) {
      const creatorUser = usersData.find((u: any) => u.name === project.created_by);
      console.log('查找创建者用户:', {
        createdBy: project.created_by,
        foundUser: creatorUser,
        creatorUserId: creatorUser?.id
      });
      if (creatorUser && creatorUser.id === currentUserId) {
        console.log('通过用户数据找到创建者，允许编辑');
        return true;
      }
    }
    
    console.log('用户无权限编辑此项目');
    return false;
  };

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
        project.user_ids?.includes(parseInt(values.member))
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

  const handleCreateModalOpen = () => {
    setIsCreateModalVisible(true);
    createForm.resetFields();
  };

  const handleCreateModalCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  const handleEditModalOpen = (project: ProjectWithMembers) => {
    setSelectedProject(project);
    setIsEditModalVisible(true);
    editForm.setFieldsValue({
      name: project.name,
      description: project.description,
      user_ids: project.user_ids,
    });
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setSelectedProject(null);
    editForm.resetFields();
  };

  const handleCreateProject = async (values: any) => {
    try {
      const createData: CreateProjectData = {
        name: values.name,
        description: values.description,
        user_ids: values.user_ids || []
      };
      
      const createdProject = await createProject(createData);
      message.success('项目创建成功！');
      handleCreateModalCancel();
      refetchProjects(); // 重新获取项目列表

      // 项目创建成功后，尝试创建消息（不阻塞流程）
      try {
        await createMessage({
          type: 'project',
          level: 'info',
          title: `新项目：${values.name}`,
          content: '创建了新项目',
          entity_type: 'project',
          entity_id: createdProject?.id ? parseInt(createdProject.id) : undefined,
          data_json: JSON.stringify({
            action: 'created',
            name: values.name,
            description: values.description,
            user_ids: values.user_ids || []
          }),
          recipient_user_ids: values.user_ids || []
        });
      } catch (e) {
        console.error('创建项目消息失败：', e);
      }
    } catch (error: any) {
      message.error(`创建失败: ${error?.message || '未知错误'}`);
    }
  };

  const handleEditProject = async (values: any) => {
    if (selectedProject) {
      try {
        const updateData: UpdateProjectData = {
          name: values.name,
          description: values.description,
          user_ids: values.user_ids || []
        };
        
        await updateProject(selectedProject.id, updateData);
        message.success('项目更新成功！');
        handleEditModalCancel();
        refetchProjects(); // 重新获取项目列表

        // 项目更新成功后，尝试创建消息（不阻塞流程）
        try {
          await createMessage({
            type: 'project',
            level: 'info',
            title: `项目已更新：${values.name}`,
            content: '项目信息已更新',
            entity_type: 'project',
            entity_id: parseInt(selectedProject.id),
            data_json: JSON.stringify({
              action: 'updated',
              name: values.name,
              description: values.description,
              user_ids: values.user_ids || []
            }),
            recipient_user_ids: values.user_ids || []
          });
        } catch (e) {
          console.error('创建项目更新消息失败：', e);
        }
      } catch (error: any) {
        message.error(`更新失败: ${error?.message || '未知错误'}`);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    // 先获取项目信息，用于消息记录
    const projectToDelete = projects.find(p => p.id === projectId);
    
    Modal.confirm({
      title: '确认删除项目',
      content: '删除后项目将无法恢复，确定要删除吗？',
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteProject(projectId);
          message.success('项目删除成功！');
          refetchProjects();

          // 项目删除成功后，尝试创建消息（不阻塞流程）
          if (projectToDelete) {
            try {
              await createMessage({
                type: 'project',
                level: 'warning',
                title: `项目已删除：${projectToDelete.name}`,
                content: '项目已被删除',
                entity_type: 'project',
                entity_id: parseInt(projectId),
                data_json: JSON.stringify({
                  action: 'deleted',
                  name: projectToDelete.name,
                  description: projectToDelete.description,
                  user_ids: projectToDelete.user_ids || []
                }),
                recipient_user_ids: projectToDelete.user_ids || []
              });
            } catch (e) {
              console.error('创建项目删除消息失败：', e);
            }
          }
        } catch (error: any) {
          message.error(`删除失败: ${error?.message || '未知错误'}`);
        }
      },
    });
  };

  const getMemberNames = (userIds: number[]) => {
    if (!usersData) return [];
    return usersData
      .filter(user => userIds.includes(user.id))
      .map(user => user.name || `用户${user.id}`);
  };

  const getMemberAvatars = (userIds: number[]) => {
    if (!usersData) return [];
    return usersData
      .filter(user => userIds.includes(user.id))
      .map(user => ({ 
        name: user.name || `用户${user.id}`, 
        avatar: user.name ? user.name.charAt(0) : `U${user.id}` 
      }));
  };

  // 项目状态管理
  const handleArchiveProject = async (projectId: string) => {
    try {
      const projectToArchive = projects.find(p => p.id === projectId);
      await updateProject(projectId, { status: 'archived' });
      message.success('项目已归档');
      refetchProjects();

      // 项目归档成功后，尝试创建消息（不阻塞流程）
      if (projectToArchive) {
        try {
          await createMessage({
            type: 'project',
            level: 'info',
            title: `项目已归档：${projectToArchive.name}`,
            content: '项目状态已变更为已归档',
            entity_type: 'project',
            entity_id: parseInt(projectId),
            data_json: JSON.stringify({
              action: 'archived',
              name: projectToArchive.name,
              status: 'archived'
            }),
            recipient_user_ids: projectToArchive.user_ids || []
          });
        } catch (e) {
          console.error('创建项目归档消息失败：', e);
        }
      }
    } catch (error: any) {
      message.error(`归档失败: ${error?.message || '未知错误'}`);
    }
  };

  const handleActivateProject = async (projectId: string) => {
    try {
      const projectToActivate = projects.find(p => p.id === projectId);
      await updateProject(projectId, { status: 'active' });
      message.success('项目已激活');
      refetchProjects();

      // 项目激活成功后，尝试创建消息（不阻塞流程）
      if (projectToActivate) {
        try {
          await createMessage({
            type: 'project',
            level: 'info',
            title: `项目已激活：${projectToActivate.name}`,
            content: '项目状态已变更为活跃',
            entity_type: 'project',
            entity_id: parseInt(projectId),
            data_json: JSON.stringify({
              action: 'activated',
              name: projectToActivate.name,
              status: 'active'
            }),
            recipient_user_ids: projectToActivate.user_ids || []
          });
        } catch (e) {
          console.error('创建项目激活消息失败：', e);
        }
      }
    } catch (error: any) {
      message.error(`激活失败: ${error?.message || '未知错误'}`);
    }
  };

  // 获取状态标签
  const getStatusTag = (status: 'active' | 'archived') => {
    if (status === 'active') {
      return <Tag color="green">活跃</Tag>;
    } else {
      return <Tag color="default">已归档</Tag>;
    }
  };

  // 获取项目操作菜单
  const getProjectActions = (project: ProjectWithMembers) => {
    // 检查用户权限
    if (!canUserEditProject(project)) {
      return []; // 没有权限的用户返回空数组
    }

    const items = [
      {
        key: 'edit',
        label: '编辑项目',
        icon: <EditOutlined />,
        onClick: () => handleEditModalOpen(project),
      },
    ];

    if (project.status === 'active') {
      items.push({
        key: 'archive',
        label: '归档项目',
        icon: <CheckCircleOutlined />,
        onClick: () => handleArchiveProject(project.id),
      });
    } else {
      items.push({
        key: 'activate',
        label: '激活项目',
        icon: <ClockCircleOutlined />,
        onClick: () => handleActivateProject(project.id),
      });
    }

    // 添加删除选项
    items.push({
      key: 'delete',
      label: '删除项目',
      icon: <DeleteOutlined />,
      onClick: () => handleDeleteProject(project.id),
    });

    return items;
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
                <Select placeholder="选择成员" allowClear loading={usersLoading}>
                  <Option value="all">全部成员</Option>
                  {userOptions.map(user => (
                    <Option key={user.value} value={user.value}>{user.label}</Option>
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
        {currentProjects.map(project => {
          // 为每个项目生成唯一的颜色
          const projectColor = generateProjectColor(project.id);
          
          // 调试：检查权限
          const hasEditPermission = canUserEditProject(project);
          console.log(`项目"${project.name}"权限检查:`, {
            projectId: project.id,
            projectName: project.name,
            hasEditPermission,
            creatorId: project.creator_id,
            createdBy: project.created_by
          });
          
          return (
          <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
            <Card
              hoverable
              className="h-full"
                style={{ borderTop: `4px solid ${projectColor}` }}
              actions={
                // 只有项目创建者才能看到操作栏
                canUserEditProject(project) ? [
                  <Dropdown
                    key="actions"
                    menu={{ items: getProjectActions(project) }}
                    placement="bottomRight"
                    trigger={['click']}
                  >
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                ] : []
              }
            >
              <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Title level={4} className="mb-0 flex-1 mr-2" style={{ color: projectColor }}>
                  {project.name}
                </Title>
                    {getStatusTag(project.status)}
                  </div>
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
                      value={project.task_count || 0}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="子任务数"
                      value={project.subtask_count || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                    />
                  </Col>
                </Row>
              </div>

              {/* 成员列表 */}
              <div>
                <Text strong className="text-sm mb-2 block">项目成员</Text>
                <div className="flex items-center gap-2">
                  <Avatar.Group maxCount={3} size="small">
                    {getMemberAvatars(project.user_ids || []).map((member, index) => (
                      <Avatar 
                        key={index} 
                          style={{ backgroundColor: projectColor }}
                        size="small"
                      >
                        {member.avatar}
                      </Avatar>
                    ))}
                  </Avatar.Group>
                  {(project.user_ids || []).length > 0 && (
                    <Text type="secondary" className="text-xs">
                      {getMemberNames(project.user_ids || []).join('、')}
                    </Text>
                  )}
                </div>
              </div>
            </Card>
          </Col>
          );
        })}
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
        title="添加项目"
        open={isCreateModalVisible}
        onCancel={handleCreateModalCancel}
        footer={null}
        confirmLoading={createLoading}
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
            name="user_ids"
            label="项目成员"
          >
            <Select
              mode="multiple"
              placeholder="请选择项目成员"
              options={userOptions}
              loading={usersLoading}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={createLoading}>
              创建项目
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        title="编辑项目"
        open={isEditModalVisible}
        onCancel={handleEditModalCancel}
        footer={null}
        confirmLoading={updateLoading}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditProject}
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
            name="user_ids"
            label="项目成员"
          >
            <Select
              mode="multiple"
              placeholder="请选择项目成员"
              options={userOptions}
              loading={usersLoading}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={updateLoading}>
              保存更改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
