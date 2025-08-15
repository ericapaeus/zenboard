import React, { useState, useMemo, useCallback } from 'react';
import { Card, Typography, Tag, Modal, Button, Input, Select, List, Form, message, Popconfirm, Row, Col, Space, Avatar, Divider, Pagination, DatePicker, Spin } from 'antd';
import { UserOutlined, PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, SearchOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Task, Subtask } from '@/types';
import { useProjects, useAuthUsers, useCreateTask, useTasks, useCreateMessage, useDeleteTask, useUpdateTask, useCreateComment, useFetchTaskComments } from '@/hooks/useApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
// const { RangePicker } = DatePicker;

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

interface TaskProps {
  displayMode?: 'full' | 'pendingOnly';
}

const Task: React.FC<TaskProps> = () => {
  // 添加样式
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .expanded-content {
        animation: slideDown 0.3s ease-out;
        overflow: hidden;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          max-height: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          max-height: 1000px;
          transform: translateY(0);
        }
      }
      
      .task-list-item {
        transition: all 0.3s ease;
      }
      
      .task-list-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      }
      
      .expand-button {
        transition: transform 0.3s ease;
      }
      
      .expand-button.expanded {
        transform: rotate(90deg);
      }
      
      .expand-button:hover {
        background-color: #f0f8ff;
        border-color: #1890ff;
      }
      
      .task-expand-button {
        transition: all 0.2s ease;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }
      
      .task-expand-button:hover {
        background-color: #f0f8ff;
        transform: scale(1.1);
      }
      
      .flow-timeline {
        position: relative;
        padding-left: 20px;
      }
      
      .flow-timeline::before {
        content: '';
        position: absolute;
        left: 10px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e8e8e8;
      }
      
      .timeline-item {
        position: relative;
        margin-bottom: 20px;
        padding-left: 30px;
      }
      
      .timeline-dot {
        position: absolute;
        left: -15px;
        top: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        z-index: 1;
      }
      
      .timeline-dot-start {
        background: #52c41a;
      }
      
      .timeline-dot-transfer {
        background: #1890ff;
      }
      
      .timeline-dot-end {
        background: #52c41a;
      }
      
      .timeline-content {
        background: white;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #f0f0f0;
      }
      
      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [subtaskForm] = Form.useForm();
  
  // 模态框状态
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  // const [isTransferModalVisible, setIsTransferModalVisible] = useState(false); // 已删除
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  // const [transferAction, setTransferAction] = useState<'transfer' | 'complete'>('transfer'); // 已删除

  // 新增：折叠状态管理
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // 新增：折叠/展开处理函数
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
        // 首次展开时加载评论
        if (!taskComments[taskId] || taskComments[taskId].length === 0) {
          loadTaskComments(taskId);
        }
      }
      return newSet;
    });
  };

  // 新增：检查任务是否展开
  const isTaskExpanded = (taskId: string) => expandedTasks.has(taskId);

  // Mock data for tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const { data: apiTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks();

  // 静态评论数据与输入框状态 - 替换为API调用
  type TaskComment = { id: number; author_id: number; author_name?: string; author_avatar?: string; content: string; created_at: string };
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // 添加评论相关的hooks
  const { createComment, loading: createCommentLoading } = useCreateComment();
  const { fetchComments: fetchTaskComments, loading: fetchCommentsLoading } = useFetchTaskComments();

  const addTaskComment = async (taskId: string) => {
    const content = (commentInputs[taskId] || '').trim();
    if (!content) { message.error('请输入评论内容'); return; }
    
    try {
      await createComment({
        content,
        task_id: Number(taskId)
      });
      
      // 重新加载评论列表
      try {
        const comments = await fetchTaskComments(Number(taskId));
        setTaskComments(prev => ({ ...prev, [taskId]: comments }));
      } catch (error) {
        console.error('重新加载评论失败:', error);
      }
      
      setCommentInputs(prev => ({ ...prev, [taskId]: '' }));
    } catch (error) {
      console.error('添加评论失败:', error);
    }
  };

  // 获取任务评论的函数
  const loadTaskComments = async (taskId: string) => {
    try {
      const comments = await fetchTaskComments(Number(taskId));
      setTaskComments(prev => ({ ...prev, [taskId]: comments }));
    } catch (error) {
      console.error('获取任务评论失败:', error);
    }
  };

  const { data: projectsData } = useProjects();
  const { data: usersData } = useAuthUsers();
  const { createTask } = useCreateTask();
  const { createMessage } = useCreateMessage();
  const { deleteTask } = useDeleteTask();
  const { updateTask } = useUpdateTask();

  // 使用useCallback包装getUserName函数，避免每次渲染时重新创建
  const getUserName = useCallback((id?: number | null) => {
    if (!id || !usersData) return '未分配';
    const u = usersData.find(u => u.id === id);
    return u?.name || `用户${id}`;
  }, [usersData]);

  const getProjectName = useCallback((id?: string | null) => {
    if (id === undefined || id === null || !projectsData) return undefined as unknown as string;
    const p = projectsData.find(p => p.id === id);
    return p?.name;
  }, [projectsData]);

  // 使用useCallback包装mapApiTaskToUi函数
  const mapApiTaskToUi = useCallback((t: {
    id: number;
    title: string;
    content?: string;
    assignee_id?: number;
    original_assignee_id?: number;
    start_date?: string;
    end_date?: string;
    progress?: number;
    project_id?: string | number;
    priority?: 'low' | 'medium' | 'high';
    subtasks?: Subtask[];
    completion_notes?: string;
    creator_id?: number;
    created_at?: string;
  }): Task => ({
    id: String(t.id),
    title: t.title,
    content: t.content || '',  // 使用content字段
    currentAssignee: getUserName(t.assignee_id),
    originalAssignee: getUserName(t.original_assignee_id) || getUserName(t.assignee_id),
    startDate: t.start_date ? new Date(t.start_date).toISOString().slice(0,10) : '',
    endDate: t.end_date ? new Date(t.end_date).toISOString().slice(0,10) : '',
    progress: typeof t.progress === 'number' ? t.progress : 0,
    project: getProjectName(t.project_id != null ? String(t.project_id) : null),
    priority: (t.priority || 'medium'),
    subtasks: t.subtasks || [], // 从后端获取子任务数据
    flowHistory: [],
    completionNotes: t.completion_notes || '',
    createdBy: getUserName(t.creator_id),
    createdAt: t.created_at || new Date().toISOString(),
    // 添加原始ID字段，用于编辑表单
    assignee_id: t.assignee_id,
    project_id: t.project_id ? Number(t.project_id) : undefined, // 确保是数字类型
  }), [getUserName, getProjectName]);

  React.useEffect(() => {
    if (apiTasks) {
      const mapped = (apiTasks as unknown as Array<{
        id: number;
        title: string;
        content?: string;
        assignee_id?: number;
        original_assignee_id?: number;
        start_date?: string;
        end_date?: string;
        progress?: number;
        project_id?: string | number;
        priority?: 'low' | 'medium' | 'high';
        subtasks?: Subtask[];
        completion_notes?: string;
        creator_id?: number;
        created_at?: string;
      }>).map(mapApiTaskToUi);
      // 按照ID倒序排序，最新创建的任务在上面
      const sortedTasks = mapped.sort((a, b) => {
        const aId = parseInt(a.id);
        const bId = parseInt(b.id);
        return bId - aId; // 倒序：ID大的在前面
      });
      setTasks(sortedTasks);
      setFilteredTasks(sortedTasks); // 同步更新过滤后的任务
    }
  }, [apiTasks, mapApiTaskToUi]);

  // 监听filteredTasks变化，用于调试
  React.useEffect(() => {
    console.log('filteredTasks更新:', filteredTasks.length);
  }, [filteredTasks]);

  // 设置搜索表单的初始值
  React.useEffect(() => {
    if (usersData && usersData.length > 0) {
      searchForm.setFieldsValue({
        member: 'all'
      });
    }
  }, [usersData, searchForm]);

  // 检查当前用户是否有权限编辑或删除任务
  const canUserEditTask = useCallback((task: Task): boolean => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return false;
    
    // 任务负责人可以编辑和删除
    if (task.assignee_id === currentUserId) return true;
    
    // 任务创建人可以编辑和删除（通过createdBy字段查找用户ID）
    if (task.createdBy && usersData) {
      const creatorUser = usersData.find((u) => u.name === task.createdBy);
      if (creatorUser && creatorUser.id === currentUserId) return true;
    }
    
    return false;
  }, [usersData]);

  // 生成所有可能的处理人选项（包括任务负责人和子任务处理人）
  const getAllAssignees = useMemo(() => {
    const assignees = new Set<string>();
    
    // 添加所有任务负责人
    tasks.forEach(task => {
      if (task.currentAssignee) {
        assignees.add(task.currentAssignee);
      }
    });
    
    // 添加所有子任务处理人
    tasks.forEach(task => {
      task.subtasks.forEach(subtask => {
        if (subtask.assignee_id) {
          const assigneeName = getUserName(subtask.assignee_id);
          if (assigneeName) {
            assignees.add(assigneeName);
          }
        }
      });
    });
    
    // 转换为数组并排序
    return Array.from(assignees).sort();
  }, [tasks, getUserName]);

  const mockUsers = getAllAssignees;
  // const mockProjects = (projectsData || []).map(p => p.name);

  const getPriorityTag = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return <Tag color="green">低</Tag>;
      case 'medium':
        return <Tag color="orange">中</Tag>;
      case 'high':
        return <Tag color="red">高</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // const showTaskDetails = (task: Task) => {
  //   setSelectedTask(task);
  //   setIsDetailsModalVisible(true);
  //   setShowAddSubtaskForm(false);
  //   // 加载任务评论
  //   loadTaskComments(task.id);
  // };

  const handleDetailsModalCancel = () => {
    setIsDetailsModalVisible(false);
    setSelectedTask(null);
    subtaskForm.resetFields();
    setShowAddSubtaskForm(false);
  };

  const handleCreateModalOpen = () => {
    setIsCreateModalVisible(true);
    createForm.resetFields();
    createForm.setFieldsValue({ subtasks: [] });
  };

  const handleCreateModalCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  const handleEditModalOpen = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalVisible(true);
    
    // 处理子任务数据，确保包含 id 字段
    const processedSubtasks = (task.subtasks || []).map(subtask => ({
      id: subtask.id,
      title: subtask.title,
      content: subtask.content,
      assignee_id: subtask.assignee_id
    }));
    
    // 将字符串日期转换为 dayjs 对象，以便 DatePicker 能正确显示
    const formValues = {
      title: task.title,
      content: task.content,
      assignee_id: task.assignee_id, // 使用原始的用户ID
      project_id: task.project_id ? Number(task.project_id) : undefined, // 确保空的 project_id 被正确处理
      priority: task.priority,
      startDate: task.startDate ? dayjs(task.startDate) : null,
      endDate: task.endDate ? dayjs(task.endDate) : null,
      subtasks: processedSubtasks,
    };
    
    editForm.setFieldsValue(formValues);
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setSelectedTask(null);
    editForm.resetFields();
  };

  // 已删除"处理任务/流转"相关逻辑

  const handleAddSubtask = (values: {
    title: string;
    content: string;
    assignee_id: number;
  }) => {
    if (selectedTask) {
      const newSubtask: Subtask = {
        id: `s${Date.now()}`,
        title: values.title,
        content: values.content,
        assignee: getUserName(values.assignee_id), // 显示用户名
        assignee_id: values.assignee_id, // 存储用户ID
      };
      const updatedTasks = tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, subtasks: [...task.subtasks, newSubtask] }
          : task
      );
      setTasks(updatedTasks);
      setSelectedTask(prev => prev ? { ...prev, subtasks: [...prev.subtasks, newSubtask] } : null);
      subtaskForm.resetFields();
      
      // 子任务添加成功后，尝试创建通知消息（不阻塞流程）
      try {
        // 收集所有需要通知的用户ID
        const recipientIds = new Set<number>();
        
        // 1. 子任务处理人
        if (values.assignee_id) {
          recipientIds.add(Number(values.assignee_id));
        }
        
        // 2. 主任务负责人（如果与子任务处理人不同）
        if (selectedTask.assignee_id && selectedTask.assignee_id !== values.assignee_id) {
          recipientIds.add(Number(selectedTask.assignee_id));
        }
        
        // 3. 项目相关人员（如果有项目）
        if (selectedTask.project_id) {
          // 这里可以添加项目成员通知逻辑
          // 暂时跳过，因为需要额外的项目成员查询
        }
        
        // 4. 任务创建人
        if (selectedTask.createdBy && usersData) {
          const creatorUser = usersData.find(u => u.name === selectedTask.createdBy);
          if (creatorUser) {
            recipientIds.add(creatorUser.id);
          }
        }
        
        // 确保有接收者才发送通知
        if (recipientIds.size > 0) {
          // 构建详细的消息内容
          const subtaskAssigneeName = getUserName(values.assignee_id);
          const mainTaskAssigneeName = getUserName(selectedTask.assignee_id);
          const projectName = selectedTask.project_id ? getProjectName(String(selectedTask.project_id)) : null;
          
          let content = `为任务"${selectedTask.title}"添加了子任务"${values.title}"`;
          if (subtaskAssigneeName) {
            content += `，子任务处理人：${subtaskAssigneeName}`;
          }
          if (mainTaskAssigneeName && mainTaskAssigneeName !== subtaskAssigneeName) {
            content += `，主任务负责人：${mainTaskAssigneeName}`;
          }
          if (projectName) {
            content += `，所属项目：${projectName}`;
          }
          
          // 检查是否与现有子任务处理人重复
          const existingSubtaskWithSameAssignee = selectedTask.subtasks.find(s => 
            s.assignee_id === values.assignee_id && s.title !== values.title
          );
          if (existingSubtaskWithSameAssignee) {
            content += `，该用户还负责其他子任务`;
          }
          
          createMessage({
            type: 'task',
            level: 'info',
            title: `子任务已添加：${values.title}`,
            content: content,
            entity_type: 'task',
            entity_id: Number(selectedTask.id),
            actor_id: getCurrentUserId(),
            data_json: JSON.stringify({
              action: 'subtask_added',
              parent_task_id: Number(selectedTask.id),
              parent_task_title: selectedTask.title,
              subtask_title: values.title,
              subtask_content: values.content,
              subtask_assignee_id: Number(values.assignee_id),
              subtask_assignee_name: subtaskAssigneeName,
              main_task_assignee_id: Number(selectedTask.assignee_id),
              main_task_assignee_name: mainTaskAssigneeName,
              project_id: selectedTask.project_id,
              project_name: projectName,
              existing_subtasks_by_same_assignee: existingSubtaskWithSameAssignee ? [existingSubtaskWithSameAssignee.title] : []
            }),
            recipient_user_ids: Array.from(recipientIds)
          });
        }
      } catch (error) {
        console.error('创建子任务添加通知失败：', error);
      }
      
      message.success('子任务添加成功！');
      setShowAddSubtaskForm(false);
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (selectedTask) {
      // 在删除前获取子任务信息用于通知
      const subtaskToDelete = selectedTask.subtasks.find(sub => sub.id === subtaskId);
      
      const updatedTasks = tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, subtasks: task.subtasks.filter(sub => sub.id !== subtaskId) }
          : task
      );
      setTasks(updatedTasks);
      setSelectedTask(prev => prev ? { ...prev, subtasks: prev.subtasks.filter(sub => sub.id !== subtaskId) } : null);
      
      // 子任务删除成功后，尝试创建通知消息（不阻塞流程）
      if (subtaskToDelete) {
        try {
          // 收集所有需要通知的用户ID
          const recipientIds = new Set<number>();
          
          // 1. 子任务处理人
          if (subtaskToDelete.assignee_id) {
            recipientIds.add(Number(subtaskToDelete.assignee_id));
          }
          
          // 2. 主任务负责人（如果与子任务处理人不同）
          if (selectedTask.assignee_id && selectedTask.assignee_id !== subtaskToDelete.assignee_id) {
            recipientIds.add(Number(selectedTask.assignee_id));
          }
          
          // 3. 项目相关人员（如果有项目）
          if (selectedTask.project_id) {
            // 这里可以添加项目成员通知逻辑
            // 暂时跳过，因为需要额外的项目成员查询
          }
          
          // 4. 任务创建人
          if (selectedTask.createdBy && usersData) {
            const creatorUser = usersData.find(u => u.name === selectedTask.createdBy);
            if (creatorUser) {
              recipientIds.add(creatorUser.id);
            }
          }
          
          // 确保有接收者才发送通知
          if (recipientIds.size > 0) {
            // 构建详细的消息内容
            const subtaskAssigneeName = getUserName(subtaskToDelete.assignee_id);
            const mainTaskAssigneeName = getUserName(selectedTask.assignee_id);
            const projectName = selectedTask.project_id ? getProjectName(String(selectedTask.project_id)) : null;
            
            let content = `从任务"${selectedTask.title}"中删除了子任务"${subtaskToDelete.title}"`;
            if (subtaskAssigneeName) {
              content += `，原子任务处理人：${subtaskAssigneeName}`;
            }
            if (mainTaskAssigneeName && mainTaskAssigneeName !== subtaskAssigneeName) {
              content += `，主任务负责人：${mainTaskAssigneeName}`;
            }
            if (projectName) {
              content += `，所属项目：${projectName}`;
            }
            
            createMessage({
              type: 'task',
              level: 'warning',
              title: `子任务已删除：${subtaskToDelete.title}`,
              content: content,
              entity_type: 'task',
              entity_id: Number(selectedTask.id),
              actor_id: getCurrentUserId(),
              data_json: JSON.stringify({
                action: 'subtask_deleted',
                parent_task_id: Number(selectedTask.id),
                parent_task_title: selectedTask.title,
                subtask_title: subtaskToDelete.title,
                subtask_content: subtaskToDelete.content,
                subtask_assignee_id: Number(subtaskToDelete.assignee_id),
                subtask_assignee_name: subtaskAssigneeName,
                main_task_assignee_id: Number(selectedTask.assignee_id),
                main_task_assignee_name: mainTaskAssigneeName,
                project_id: selectedTask.project_id,
                project_name: projectName
              }),
              recipient_user_ids: Array.from(recipientIds)
            });
          }
        } catch (error) {
          console.error('创建子任务删除通知失败：', error);
        }
      }
      
      message.success('子任务删除成功！');
    }
  };

  const handleCreateTask = async (values: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    assignee_id: number;
    startDate: dayjs.Dayjs | null;
    endDate: dayjs.Dayjs | null;
    project_id?: number;
    subtasks?: Array<{
      id: string;
      title: string;
      content: string;
      assignee_id: number;
    }>;
  }) => {
    try {
      // 处理创建任务的数据
      const createData: {
        title: string;
        content: string;
        priority: 'low' | 'medium' | 'high';
        assignee_id: number;
        parent_task_id?: undefined;
        start_date?: string;
        end_date?: string;
        project_id?: number;
        subtasks: Array<{
          id: string;
          title: string;
          content: string;
          assignee_id: number;
        }>;
      } = {
        title: values.title,
        content: values.content,
        priority: values.priority,
        assignee_id: values.assignee_id,
        parent_task_id: undefined,
        start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        end_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
        subtasks: values.subtasks || [],
      };
      
      // 只有当 project_id 有值时才传递
      if (values.project_id !== undefined && values.project_id !== null && values.project_id !== '') {
        createData.project_id = values.project_id;
      }
      
      const created = await createTask(createData);
      
      // 任务创建成功后，尝试创建通知消息（不阻塞流程）
      try {
        // 收集所有需要通知的用户ID
        const recipientIds = new Set<number>();
        
        // 1. 任务负责人
        if (values.assignee_id) {
          recipientIds.add(values.assignee_id);
        }
        
        // 2. 所有子任务处理人
        if (values.subtasks && values.subtasks.length > 0) {
          values.subtasks.forEach((subtask) => {
            if (subtask.assignee_id) {
              recipientIds.add(subtask.assignee_id);
            }
          });
        }
        
        // 3. 任务创建人（当前用户，需要从认证状态获取）
        const currentUserId = getCurrentUserId();
        if (currentUserId) {
          recipientIds.add(currentUserId);
        }
        
        // 确保有接收者才发送通知
        if (recipientIds.size > 0 && created?.id) {
          // 构建详细的消息内容
          const assigneeName = getUserName(values.assignee_id);
          const projectName = values.project_id ? getProjectName(String(values.project_id)) : null;
          
          let content = `任务"${values.title}"已创建`;
          if (assigneeName) {
            content += `，负责人：${assigneeName}`;
          }
          if (projectName) {
            content += `，所属项目：${projectName}`;
          }
          if (values.subtasks && values.subtasks.length > 0) {
            content += `，包含${values.subtasks.length}个子任务`;
          }
          
          await createMessage({
            type: 'task',
            level: 'info',
            title: `新任务：${values.title}`,
            content: content,
            entity_type: 'task',
            entity_id: Number(created.id),
            actor_id: getCurrentUserId(),
            data_json: JSON.stringify({
              action: 'created',
              title: values.title,
              content: values.content,
              priority: values.priority,
              assignee_id: values.assignee_id,
              assignee_name: assigneeName,
              project_id: values.project_id || null,
              project_name: projectName,
              start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
              end_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
              subtasks: values.subtasks || []
            }),
            recipient_user_ids: Array.from(recipientIds)
          });
        }
      } catch (error) {
        console.error('创建任务通知失败：', error);
      }
      
      message.success('任务创建成功！');
      handleCreateModalCancel();
      refetchTasks();
      return created;
    } catch (error) {
      // 已在 hook 内提示
      console.error('创建任务失败:', error);
    }
  };

  const handleEditTask = async (values: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    assignee_id: number;
    startDate: dayjs.Dayjs | null;
    endDate: dayjs.Dayjs | null;
    project_id?: number;
    subtasks?: Array<{
      id: string;
      title: string;
      content: string;
      assignee_id: number;
    }>;
  }) => {
    if (selectedTask) {
      try {
        // 处理子任务数据，确保包含所有必要字段
        const processedSubtasks = (values.subtasks || []).map((subtask, index) => {
          // 如果是现有子任务，保留原始ID和创建时间
          const existingSubtask = selectedTask.subtasks.find(s => s.title === subtask.title);
          return {
            id: existingSubtask?.id || `temp_${Date.now()}_${index}`,
            title: subtask.title,
            content: subtask.content || '',
            assignee_id: subtask.assignee_id,
            created_at: existingSubtask?.created_at || new Date().toISOString()
          };
        });

        // 处理日期格式
        const processedValues: {
          title: string;
          content: string;
          priority: 'low' | 'medium' | 'high';
          assignee_id: number;
          start_date?: string;
          end_date?: string;
          project_id?: number;
          subtasks: Array<{
            id: string;
            title: string;
            content: string;
            assignee_id: number;
            created_at: string;
          }>;
        } = {
          title: values.title,
          content: values.content, // 直接使用 content 字段
          priority: values.priority,
          assignee_id: values.assignee_id,
          start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
          end_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
          subtasks: processedSubtasks,
        };
        
        // 只有当 project_id 有值时才传递
        if (values.project_id !== undefined && values.project_id !== null) {
          processedValues.project_id = values.project_id;
        }
        
        console.log('发送到后端的子任务数据:', processedSubtasks);
        console.log('发送到后端的完整数据:', processedValues);
        
        // 调用后端API更新任务
        await updateTask(Number(selectedTask.id), processedValues);
        
        // 任务更新成功后，尝试创建通知消息（不阻塞流程）
        try {
          // 收集所有需要通知的用户ID
          const recipientIds = new Set<number>();
          
          // 1. 原任务负责人
          if (selectedTask.assignee_id) {
            recipientIds.add(selectedTask.assignee_id);
          }
          
          // 2. 新任务负责人（如果发生变化）
          if (values.assignee_id && values.assignee_id !== selectedTask.assignee_id) {
            recipientIds.add(values.assignee_id);
          }
          
          // 3. 所有子任务处理人（包括原有的和新增的）
          if (processedSubtasks && processedSubtasks.length > 0) {
            processedSubtasks.forEach((subtask) => {
              if (subtask.assignee_id) {
                recipientIds.add(subtask.assignee_id);
              }
            });
          }
          
          // 4. 原有子任务处理人（如果被移除或修改）
          if (selectedTask.subtasks && selectedTask.subtasks.length > 0) {
            selectedTask.subtasks.forEach((subtask) => {
              if (subtask.assignee_id) {
                recipientIds.add(subtask.assignee_id);
              }
            });
          }
          
          // 5. 任务创建人（需要从用户数据中查找）
          // 这里需要根据创建者姓名查找用户ID
          if (selectedTask.createdBy && usersData) {
            const creatorUser = usersData.find(u => u.name === selectedTask.createdBy);
            if (creatorUser) {
              recipientIds.add(creatorUser.id);
            }
          }
          
          // 确保有接收者才发送通知
          if (recipientIds.size > 0) {
            // 构建详细的消息内容
            const oldAssigneeName = getUserName(selectedTask.assignee_id);
            const newAssigneeName = getUserName(values.assignee_id);
            const projectName = values.project_id ? getProjectName(String(values.project_id)) : null;
            
            let content = `任务"${values.title}"已更新`;
            
            // 负责人变化信息
            if (oldAssigneeName && newAssigneeName && oldAssigneeName !== newAssigneeName) {
              content += `，负责人从"${oldAssigneeName}"变更为"${newAssigneeName}"`;
            } else if (newAssigneeName) {
              content += `，负责人：${newAssigneeName}`;
            }
            
            // 项目信息
            if (projectName) {
              content += `，所属项目：${projectName}`;
            }
            
            // 子任务变化信息
            const subtaskChanges: string[] = [];
            if (processedSubtasks && processedSubtasks.length > 0) {
              const oldSubtasksCount = selectedTask.subtasks.length;
              const newSubtasksCount = processedSubtasks.length;
              
              if (newSubtasksCount > oldSubtasksCount) {
                content += `，新增${newSubtasksCount - oldSubtasksCount}个子任务`;
              } else if (newSubtasksCount < oldSubtasksCount) {
                content += `，移除${oldSubtasksCount - newSubtasksCount}个子任务`;
              } else {
                content += `，包含${newSubtasksCount}个子任务`;
              }
              
              // 检测子任务处理人变化
              processedSubtasks.forEach((newSubtask) => {
                const oldSubtask = selectedTask.subtasks.find(s => s.title === newSubtask.title);
                if (oldSubtask && oldSubtask.assignee_id !== newSubtask.assignee_id) {
                  const oldSubtaskAssignee = getUserName(oldSubtask.assignee_id);
                  const newSubtaskAssignee = getUserName(newSubtask.assignee_id);
                  if (oldSubtaskAssignee && newSubtaskAssignee) {
                    subtaskChanges.push(`子任务"${newSubtask.title}"处理人从"${oldSubtaskAssignee}"变更为"${newSubtaskAssignee}"`);
                  }
                }
              });
              
              if (subtaskChanges.length > 0) {
                content += `，${subtaskChanges.join('，')}`;
              }
            }
            
            await createMessage({
              type: 'task',
              level: 'info',
              title: `任务已更新：${values.title}`,
              content: content,
              entity_type: 'task',
              entity_id: Number(selectedTask.id),
              actor_id: getCurrentUserId(),
              data_json: JSON.stringify({
                action: 'updated',
                title: values.title,
                content: values.content,
                priority: values.priority,
                old_assignee_id: selectedTask.assignee_id,
                old_assignee_name: oldAssigneeName,
                new_assignee_id: values.assignee_id,
                new_assignee_name: newAssigneeName,
                project_id: values.project_id || null,
                project_name: projectName,
                start_date: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
                end_date: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
                subtasks: processedSubtasks,
                subtask_changes: subtaskChanges
              }),
              recipient_user_ids: Array.from(recipientIds)
            });
          }
        } catch (error) {
          console.error('创建任务更新通知失败：', error);
        }
        
        // 刷新任务列表
        refetchTasks();
        
        // 关闭编辑模态框
        handleEditModalCancel();
        
        // 显示成功消息
        message.success('任务更新成功！');
      } catch (error) {
        console.error('更新任务失败:', error);
        // 错误消息已在hook中处理
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // 在删除前获取任务信息用于通知
      const taskToDelete = tasks.find(t => t.id === taskId);
      
      await deleteTask(Number(taskId));
      
      // 任务删除成功后，尝试创建通知消息（不阻塞流程）
      if (taskToDelete) {
        try {
          // 收集所有需要通知的用户ID
          const recipientIds = new Set<number>();
          
          // 1. 任务负责人
          if (taskToDelete.assignee_id) {
            recipientIds.add(Number(taskToDelete.assignee_id));
          }
          
          // 2. 所有子任务处理人
          if (taskToDelete.subtasks && taskToDelete.subtasks.length > 0) {
            taskToDelete.subtasks.forEach((subtask) => {
              if (subtask.assignee_id) {
                recipientIds.add(Number(subtask.assignee_id));
              }
            });
          }

          // 3. 任务创建人
          if (taskToDelete.createdBy && usersData) {
            const creatorUser = usersData.find(u => u.name === taskToDelete.createdBy);
            if (creatorUser) {
              recipientIds.add(creatorUser.id);
            }
          }
          
          // 确保有接收者才发送通知
          if (recipientIds.size > 0) {
            // 构建详细的消息内容
            const assigneeName = getUserName(taskToDelete.assignee_id);
            const projectName = taskToDelete.project_id ? getProjectName(String(taskToDelete.project_id)) : null;
            
            let content = `任务"${taskToDelete.title}"已被删除`;
            if (assigneeName) {
              content += `，原负责人：${assigneeName}`;
            }
            if (projectName) {
              content += `，所属项目：${projectName}`;
            }
            if (taskToDelete.subtasks && taskToDelete.subtasks.length > 0) {
              content += `，包含${taskToDelete.subtasks.length}个子任务`;
            }
            
            await createMessage({
              type: 'task',
              level: 'warning',
              title: `任务已删除：${taskToDelete.title}`,
              content: content,
              entity_type: 'task',
              entity_id: Number(taskId),
              actor_id: getCurrentUserId(),
              data_json: JSON.stringify({
                action: 'deleted',
                title: taskToDelete.title,
                content: taskToDelete.content,
                priority: taskToDelete.priority,
                assignee_id: taskToDelete.assignee_id,
                assignee_name: assigneeName,
                project_id: taskToDelete.project_id,
                project_name: projectName
              }),
              recipient_user_ids: Array.from(recipientIds)
            });
          }
        } catch (error) {
          console.error('创建任务删除通知失败：', error);
        }
      }
      
      message.success('任务删除成功！');
      handleDetailsModalCancel();
      refetchTasks();
    } catch (error) {
      // 已在 hook 内提示
      console.error('删除任务失败:', error);
    }
  };

  // 搜索和筛选功能
  const handleSearch = (values: {
    keyword?: string;
    member?: string;
  }) => {
    console.log('搜索参数:', values); // 调试信息
    let filtered = [...tasks];
    
    // 关键词搜索
    if (values.keyword) {
      const keyword = values.keyword.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(keyword) ||
        task.content.toLowerCase().includes(keyword) ||
        task.currentAssignee.toLowerCase().includes(keyword) ||
        task.project?.toLowerCase().includes(keyword) ||
        // 添加子任务标题和内容的搜索
        task.subtasks.some(subtask => 
          subtask.title.toLowerCase().includes(keyword) ||
          subtask.content.toLowerCase().includes(keyword)
        )
      );
    }
    
    // 成员筛选 - 同时搜索任务负责人和子任务处理人
    if (values.member && values.member !== 'all') {
      console.log('按成员筛选:', values.member); // 调试信息
      console.log('当前所有任务负责人:', tasks.map(t => t.currentAssignee)); // 调试信息
      filtered = filtered.filter(task => {
        // 检查任务负责人是否匹配
        const mainTaskMatches = task.currentAssignee === values.member;
        
        // 检查子任务处理人是否匹配
        const subtaskMatches = task.subtasks.some(subtask => {
          const subtaskAssigneeName = getUserName(subtask.assignee_id);
          return subtaskAssigneeName === values.member;
        });
        
        const matches = mainTaskMatches || subtaskMatches;
        console.log(`任务"${task.title}"负责人: ${task.currentAssignee}, 子任务处理人: ${task.subtasks.map(s => getUserName(s.assignee_id)).join(', ')}, 匹配: ${matches}`); // 调试信息
        return matches;
      });
    }
    
    console.log('过滤前任务数量:', tasks.length); // 调试信息
    console.log('过滤后任务数量:', filtered.length); // 调试信息
    
    // 应用过滤结果
    setFilteredTasks(filtered);
    setCurrentPage(1);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setFilteredTasks(tasks);
    setCurrentPage(1);
  };

  // 根据当前标签页过滤任务
  // const getTasksByStatus = (_status: string) => {
  //   return tasks;
  // };

  // 初始化筛选结果
  React.useEffect(() => {
    // 后端获取完成后刷新分页
    setCurrentPage(1);
  }, [tasks]);

  // 过滤和分页逻辑
  const getCurrentTabTasks = () => {
    return filteredTasks.length > 0 ? filteredTasks : tasks;
  };

  const currentTabTasks = getCurrentTabTasks();
  // const paginatedTasks = currentTabTasks.slice(
  //   (currentPage - 1) * pageSize,
  //   currentPage * pageSize
  // );

  // const totalPages = Math.ceil(currentTabTasks.length / pageSize);

  // const renderTaskCard = (task: Task) => (

  const renderExpandableTaskList = () => (
    <List
      className="task-list"
      itemLayout="vertical"
      size="large"
      dataSource={currentTabTasks}
      renderItem={(task) => (
        <List.Item
          key={task.id}
          className="task-list-item"
          style={{ 
            borderTop: `4px solid ${task.priority === 'high' ? '#ff4d4f' : task.priority === 'medium' ? '#faad14' : '#52c41a'}`,
            marginBottom: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '20px'
          }}
          actions={
            canUserEditTask(task) ? [
              <Button
                key="edit"
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditModalOpen(task)}
              >
                编辑
              </Button>,
              <Popconfirm
                key="delete"
                title="确定要删除此任务吗？"
                onConfirm={() => handleDeleteTask(task.id)}
                okText="是"
                cancelText="否"
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            ] : []
          }
        >
          {/* 任务基本信息 */}
          <div className="task-basic-info mb-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 flex-1">
                <Button
                  type="text"
                  size="small"
                  className="task-expand-button"
                  icon={
                    isTaskExpanded(task.id) ? 
                    <DownOutlined className="expand-button expanded" /> : 
                    <RightOutlined className="expand-button" />
                  }
                  onClick={() => toggleTaskExpansion(task.id)}
                  style={{ 
                    padding: '4px', 
                    minWidth: 'auto',
                    color: '#1890ff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px'
                  }}
                  title={isTaskExpanded(task.id) ? '收起详情' : '展开详情'}
                />
                <Title level={4} className="m-0">{task.title}</Title>
                <Text type="secondary" className="text-xs ml-2">
                  {isTaskExpanded(task.id) ? '点击收起' : '点击展开详情'}
                </Text>
              </div>
              <Space>
                {getPriorityTag(task.priority)}
              </Space>
            </div>
            
            <Paragraph className="text-gray-600 mb-3">
              {task.content}
            </Paragraph>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-gray-400" />
                  <Text type="secondary">任务负责人: {task.currentAssignee}</Text>
                </div>
              </Col>
              
              <Col xs={24} sm={8}>
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-gray-400" />
                  <Text type="secondary">
                    {formatDate(task.startDate)} - {formatDate(task.endDate)}
                  </Text>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-gray-400" />
                  <Text type="secondary">项目: {task.project || '未指定'}</Text>
                </div>
              </Col>
            </Row>

            <Divider className="my-3" />

                {task.subtasks.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                    <CheckCircleOutlined className="text-gray-400" />
                    <Text type="secondary">子任务: {task.subtasks.length} 个</Text>
              </div>
            )}
          </div>
          
          {/* 展开的详细信息 - 条件渲染 */}
          {isTaskExpanded(task.id) && (
            <div className="expanded-content">
              <Divider style={{ margin: '16px 0' }} />
              
              {/* 展开内容标题 */}
              <div className="mb-4">
                <Title level={5} style={{ color: '#1890ff', margin: 0 }}>
                  📋 任务详细信息
                </Title>
              </div>
              
              {/* 子任务列表 */}
              {task.subtasks.length > 0 && (
                <div className="mb-6">
                  <Title level={5} className="mb-3">子任务列表</Title>
                  <List
                    size="small"
                    bordered
                    dataSource={task.subtasks}
                    renderItem={subtask => (
                      <List.Item>
                        <div className="w-full">
                          <div className="flex justify-between items-start mb-1">
                            <Text strong>{subtask.title}</Text>
                            {(subtask.assignee || (subtask.assignee_id && getUserName(subtask.assignee_id))) && (
                              <Tag color="blue">
                                {subtask.assignee || getUserName(subtask.assignee_id)}
                              </Tag>
                            )}
                          </div>
                          <Text type="secondary" className="block">{subtask.content}</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              )}
              {/* 评论 */}
              <div className="mb-6">
                <Title level={5} className="mb-3">评论</Title>
                  <List
                    size="small"
                    bordered
                  dataSource={taskComments[task.id] || []}
                  locale={{ emptyText: '暂无评论' }}
                  loading={fetchCommentsLoading}
                  renderItem={(c: {
                    id: number;
                    author_id: number;
                    author_name?: string;
                    author_avatar?: string;
                    content: string;
                    created_at: string;
                  }) => (
                      <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar size="small" icon={<UserOutlined />} />}
                        title={<Text strong>{c.author_name || `用户${c.author_id}`}</Text>}
                        description={
                          <div>
                            <div style={{ background: '#fff' }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(c.content)}</ReactMarkdown>
                            </div>
                            <Text type="secondary" className="text-xs">{formatDateTime(c.created_at)}</Text>
                            </div>
                        }
                      />
                      </List.Item>
                    )}
                  />
                <div className="mt-3">
                  <Input.TextArea
                    rows={3}
                    placeholder="输入评论，支持 Markdown"
                    value={commentInputs[task.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                  />
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <Button 
                      type="primary" 
                      size="small" 
                      loading={createCommentLoading}
                      onClick={() => addTaskComment(task.id)}
                    >
                      添加评论
                    </Button>
                  </div>
              </div>
              </div>
            </div>
          )}
        </List.Item>
      )}
    />
  );

  return (
    <div className="p-6">
          {/* 搜索区域 */}
          <Card className="mb-6 shadow-sm">
            <div className="mb-4">
              <Text type="secondary" className="text-sm">
                💡 搜索提示：关键词搜索包含任务标题、内容、处理人、项目名称和子任务信息；处理人筛选包含任务负责人和子任务处理人
              </Text>
            </div>
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
                      placeholder="搜索任务标题、内容、处理人或项目"
                      prefix={<SearchOutlined className="text-gray-400" />}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="member" className="w-full mb-0">
                    <Select 
                      placeholder="选择处理人（包含任务负责人和子任务处理人）" 
                      allowClear
                      onChange={(value) => console.log('搜索表单处理人选择变化:', value)}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      <Option value="all">全部成员</Option>
                      {mockUsers.map(user => (
                        <Option key={user} value={user}>{user}</Option>
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

      {/* 任务列表 */}
      {tasksLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '28px 0' }}>
          <Spin />
        </div>
      ) : (
        renderExpandableTaskList()
      )}

      {/* 分页组件 */}
      {currentTabTasks.length > 0 && (
        <div className="flex justify-center mt-8">
          <Pagination
            current={currentPage}
            total={currentTabTasks.length}
            pageSize={pageSize}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            onShowSizeChange={(current, size) => {
              setCurrentPage(1);
              setPageSize(size);
            }}
          />
        </div>
      )}

      {/* 空状态显示 */}
      {!tasksLoading && currentTabTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {/* 已移除标签页 */}
          </div>
          <div className="text-gray-400 text-sm">
            {/* 已移除标签页 */}
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <span>任务详情: {selectedTask.title}</span>
              {getPriorityTag(selectedTask.priority)}
            </div>
          }
          visible={isDetailsModalVisible}
          onCancel={handleDetailsModalCancel}
          footer={[
            <Button key="back" onClick={handleDetailsModalCancel}>
              关闭
              </Button>,
              <Button key="edit" icon={<EditOutlined />} onClick={() => handleEditModalOpen(selectedTask)}>
                编辑
            </Button>,
            <Popconfirm
              title="确定要删除此任务吗？"
              onConfirm={() => handleDeleteTask(selectedTask.id)}
              okText="是"
              cancelText="否"
            >
              <Button key="delete" type="primary" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>,
          ]}
          width={800}
        >
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>任务负责人:</Text> {selectedTask.currentAssignee}
              </Col>
              <Col span={12}>
                <Text strong>所属项目:</Text> {selectedTask.project || '未指定'}
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>开始时间:</Text> {formatDate(selectedTask.startDate)}
              </Col>
              <Col span={12}>
                <Text strong>结束时间:</Text> {formatDate(selectedTask.endDate)}
              </Col>
            </Row>

            <div>
              <Text strong>任务内容:</Text>
              <Paragraph className="mt-2">{selectedTask.content}</Paragraph>
            </div>

            {/* 评论 */}
                <Divider />
            <Title level={4}>评论</Title>
                <List
                  size="small"
              dataSource={taskComments[selectedTask.id] || []}
              locale={{ emptyText: '暂无评论' }}
              loading={fetchCommentsLoading}
              renderItem={(c: {
                id: number;
                author_id: number;
                author_name?: string;
                author_avatar?: string;
                content: string;
                created_at: string;
              }) => (
                    <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar size="small" icon={<UserOutlined />} />}
                    title={<Text strong>{c.author_name || `用户${c.author_id}`}</Text>}
                    description={
                      <div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalizeMarkdown(c.content)}</ReactMarkdown>
                        <Text type="secondary" className="text-xs">{formatDateTime(c.created_at)}</Text>
                        </div>
                    }
                  />
                    </List.Item>
                  )}
                />
            <div className="mt-3">
              <Input.TextArea
                rows={3}
                placeholder="输入评论，支持 Markdown"
                value={commentInputs[selectedTask.id] || ''}
                onChange={(e) => setCommentInputs(prev => ({ ...prev, [selectedTask.id]: e.target.value }))}
              />
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Button 
                  type="primary" 
                  size="small" 
                  loading={createCommentLoading}
                  onClick={() => addTaskComment(selectedTask.id)}
                >
                  添加评论
                </Button>
              </div>
            </div>

            <Divider />

            <div>
              <div className="flex justify-between items-center mb-3">
                <Title level={4} className="m-0">子任务</Title>
                {!showAddSubtaskForm && (
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() => setShowAddSubtaskForm(true)}
                    icon={<PlusOutlined />}
                  >
                    添加子任务
                  </Button>
                )}
              </div>

              {selectedTask.subtasks.length > 0 ? (
                <List
                  bordered
                  dataSource={selectedTask.subtasks}
                  renderItem={subtask => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteSubtask(subtask.id)}
                        />,
                      ]}
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-1">
                          <Text strong>{subtask.title}</Text>
                          {(subtask.assignee || (subtask.assignee_id && getUserName(subtask.assignee_id))) && (
                            <Tag color="blue">
                              {subtask.assignee || getUserName(subtask.assignee_id)}
                            </Tag>
                          )}
                        </div>
                        <Text type="secondary" className="block mb-1">{subtask.content}</Text>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  暂无子任务
                </div>
              )}

              {showAddSubtaskForm && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <Title level={5} className="mb-3">添加子任务</Title>
                  <Form
                    form={subtaskForm}
                    layout="vertical"
                    onFinish={handleAddSubtask}
                  >
                    <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item
                              name="title"
                              label="子任务标题"
                              rules={[{ required: true, message: '请输入子任务标题！' }]}
                            >
                              <Input placeholder="请输入子任务标题" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name="assignee_id"
                              label="处理人"
                              rules={[{ required: true, message: '请选择子任务处理人！' }]}
                            >
                              <Select placeholder="选择处理人" onChange={(value) => console.log('处理人选择变化:', value)}>
                                {(usersData || []).map(user => (
                                  <Option key={user.id} value={user.id}>{user.name || `用户${user.id}`}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        
                        <Form.Item
                          name="content"
                          label="子任务内容"
                          rules={[{ required: true, message: '请输入子任务内容！' }]}
                        >
                          <TextArea rows={3} placeholder="请输入子任务内容" />
                        </Form.Item>

                    <div className="flex gap-2">
                      <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                        添加
                      </Button>
                      <Button onClick={() => setShowAddSubtaskForm(false)}>
                        取消
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Task Modal */}
      <Modal
        title="添加"
        visible={isCreateModalVisible}
        onCancel={handleCreateModalCancel}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题！' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="任务内容"
            rules={[{ required: true, message: '请输入任务内容！' }]}
          >
            <TextArea rows={4} placeholder="请输入详细的任务内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignee_id"
                label="任务负责人"
                rules={[{ required: true, message: '请选择任务负责人！' }]}
              >
                <Select placeholder="选择任务负责人">
                  {(usersData || []).map(user => (
                    <Option key={user.id} value={user.id}>{user.name || `用户${user.id}`}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级！' }]}
              >
                <Select placeholder="选择优先级">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间！' }]}
              >
                <DatePicker 
                  showTime={false}
                  format="YYYY-MM-DD"
                  placeholder="选择开始时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间！' }]}
              >
                <DatePicker 
                  showTime={false}
                  format="YYYY-MM-DD"
                  placeholder="选择结束时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="project_id"
            label="所属项目"
          >
            <Select 
              placeholder="选择所属项目（可选）" 
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {(projectsData || []).map(project => (
                <Option key={project.id} value={Number(project.id)}>{project.name}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* 子任务管理 */}
          <Form.Item label="子任务">
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <Text strong>子任务列表</Text>
                <Button 
                  type="dashed" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const currentSubtasks = createForm.getFieldValue('subtasks') || [];
                    createForm.setFieldsValue({
                      subtasks: [...currentSubtasks, { id: `temp_${Date.now()}`, title: '', content: '', assignee_id: null }]
                    });
                  }}
                >
                  添加子任务
                </Button>
              </div>
              <Form.List name="subtasks">
                {(fields, { remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="border rounded p-3 mb-2 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <Text strong>子任务 {name + 1}</Text>
                          <Button 
                            type="text" 
                            danger 
                            size="small" 
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          />
                        </div>
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'title']}
                                rules={[{ required: true, message: '请输入子任务标题！' }]}
                              >
                                <Input placeholder="子任务标题" />
                              </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'assignee_id']}
                                label="处理人"
                                rules={[{ required: true, message: '请选择子任务处理人！' }]}
                              >
                                <Select placeholder="选择处理人" onChange={(value) => console.log('处理人选择变化:', value)}>
                                {(usersData || []).map(user => (
                                  <Option key={user.id} value={user.id}>{user.name || `用户${user.id}`}</Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'content']}
                                rules={[{ required: true, message: '请输入子任务内容！' }]}
                              >
                                <TextArea rows={2} placeholder="子任务内容" />
                              </Form.Item>
                            </Col>
                          </Row>
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Task Modal */}
      {selectedTask && (
        <Modal
          title="编辑"
          visible={isEditModalVisible}
          onCancel={handleEditModalCancel}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditTask}
            initialValues={selectedTask}
          >
            <Form.Item
              name="title"
              label="任务标题"
              rules={[{ required: true, message: '请输入任务标题！' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="content"
              label="任务内容"
              rules={[{ required: true, message: '请输入任务内容！' }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="assignee_id"
                  label="任务负责人"
                  rules={[{ required: true, message: '请选择任务负责人！' }]}
                >
                  <Select placeholder="选择任务负责人">
                    {(usersData || []).map(user => (
                      <Option key={user.id} value={user.id}>{user.name || `用户${user.id}`}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="优先级"
                  rules={[{ required: true, message: '请选择优先级！' }]}
                >
                  <Select placeholder="选择优先级">
                    <Option value="low">低</Option>
                    <Option value="medium">中</Option>
                    <Option value="high">高</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  label="开始时间"
                  rules={[{ required: true, message: '请选择开始时间！' }]}
                >
                  <DatePicker 
                    showTime={false}
                    format="YYYY-MM-DD"
                    placeholder="选择开始时间"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label="结束时间"
                  rules={[{ required: true, message: '请选择结束时间！' }]}
                >
                  <DatePicker 
                    showTime={false}
                    format="YYYY-MM-DD"
                    placeholder="选择结束时间"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="project_id"
              label="所属项目"
            >
              <Select 
                placeholder="选择所属项目（可选）" 
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
              >
                {(projectsData || []).map(project => (
                  <Option key={project.id} value={Number(project.id)}>{project.name}</Option>
                ))}
              </Select>
            </Form.Item>

            {/* 子任务管理 */}
            <Form.Item label="子任务">
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <Text strong>子任务列表</Text>
                  <Button 
                    type="dashed" 
                    size="small" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const currentSubtasks = editForm.getFieldValue('subtasks') || [];
                      editForm.setFieldsValue({
                        subtasks: [...currentSubtasks, { id: `temp_${Date.now()}`, title: '', content: '', assignee_id: null }]
                      });
                    }}
                  >
                    添加子任务
                  </Button>
                </div>
                
                <Form.List name="subtasks">
                  {(fields, { remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key} className="border rounded p-3 mb-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <Text strong>子任务 {name + 1}</Text>
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            >
                              删除
                            </Button>
                          </div>
                          
                          {/* 隐藏的 id 字段 */}
                          <Form.Item
                            {...restField}
                            name={[name, 'id']}
                            hidden
                          >
                            <Input />
                          </Form.Item>
                          
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'title']}
                                rules={[{ required: true, message: '请输入子任务标题！' }]}
                              >
                                <Input placeholder="子任务标题" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'assignee_id']}
                                label="处理人"
                                rules={[{ required: true, message: '请选择子任务处理人！' }]}
                              >
                                <Select placeholder="选择处理人" onChange={(value) => console.log('处理人选择变化:', value)}>
                                  {(usersData || []).map(user => (
                                    <Option key={user.id} value={user.id}>{user.name || `用户${user.id}`}</Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'content']}
                                rules={[{ required: true, message: '请输入子任务内容！' }]}
                              >
                                <TextArea rows={2} placeholder="子任务内容" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </>
                  )}
                </Form.List>
              </div>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block
              >
                保存更改
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* 已移除处理任务/流转弹窗 */}
    </div>
  );
};

export default Task;
