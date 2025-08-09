import { api } from '@/utils/api';
import type { ApiResponse } from '@/utils/api';

// 类型定义
export interface User {
  id: number;
  email?: string;
  name?: string;
  phone?: string;
  role: string;
  status: '未审核' | '待审核' | '已通过' | '已拒绝';
  avatar?: string;
  hire_date?: string;
  contract_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  project_id?: string;
  parent_task_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Diary {
  id: string;
  title: string;
  content: string;
  visibility: 'public' | 'project' | 'private' | 'members';
  shared_with?: string[];
  project_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  user_id: string;
  hire_date: string;
  expire_date: string;
  status: 'active' | 'expired' | 'terminated';
  created_at: string;
  updated_at: string;
}

// 认证相关 API
export const authApi = {
  // 二维码登录
  login: (qrCode: string): Promise<ApiResponse<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
  }>> => {
    return api.post('/api/auth/login', { qr_code: qrCode }, { skipAuth: true });
  },

  // 刷新 token
  refresh: (refreshToken: string): Promise<ApiResponse<{
    access_token: string;
    refresh_token: string;
    token_type: string;
  }>> => {
    return api.post('/api/auth/refresh', { refresh_token: refreshToken }, { skipAuth: true });
  },

  // 退出登录
  logout: (): Promise<ApiResponse<null>> => {
    return api.post('/api/auth/logout');
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<User>> => {
    return api.get('/api/auth/wechat/me');
  },

  // 更新用户资料
  updateProfile: (data: {
    name?: string;
    phone?: string;
    email?: string;
    hire_date?: Date;
    contract_expiry?: Date;
    status?: string;
  }): Promise<ApiResponse<User>> => {
    return api.put('/api/auth/wechat/profile', data);
  },
};

// 用户管理 API
export const userApi = {
  // 获取用户列表
  getUsers: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
  }): Promise<ApiResponse<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.role) searchParams.append('role', params.role);

    const query = searchParams.toString();
    return api.get(`/api/users${query ? `?${query}` : ''}`);
  },

  // 获取单个用户
  getUser: (id: string): Promise<ApiResponse<User>> => {
    return api.get(`/api/users/${id}`);
  },

  // 创建用户
  createUser: (userData: {
    username: string;
    nickname: string;
    phone: string;
    role: string;
  }): Promise<ApiResponse<User>> => {
    return api.post('/api/users', userData);
  },

  // 更新用户
  updateUser: (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    return api.put(`/api/users/${id}`, userData);
  },

  // 删除用户
  deleteUser: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/users/${id}`);
  },

  // 更新用户状态
  updateUserStatus: (id: string, status: 'active' | 'inactive'): Promise<ApiResponse<User>> => {
    return api.patch(`/api/users/${id}/status`, { status });
  },
};

// 团队管理 API
export const teamApi = {
  // 获取团队成员
  getMembers: (): Promise<ApiResponse<User[]>> => {
    return api.get('/api/team/members');
  },

  // 获取待审批用户
  getPendingApprovals: (): Promise<ApiResponse<User[]>> => {
    return api.get('/api/team/approvals/pending');
  },

  // 审批用户
  approveUser: (userId: string, approved: boolean, reason?: string): Promise<ApiResponse<User>> => {
    return api.post(`/api/team/approvals/${userId}`, { approved, reason });
  },

  // 获取合同列表
  getContracts: (): Promise<ApiResponse<Contract[]>> => {
    return api.get('/api/team/contracts');
  },

  // 创建合同
  createContract: (contractData: {
    user_id: string;
    hire_date: string;
    expire_date: string;
  }): Promise<ApiResponse<Contract>> => {
    return api.post('/api/team/contracts', contractData);
  },

  // 更新合同
  updateContract: (id: string, contractData: Partial<Contract>): Promise<ApiResponse<Contract>> => {
    return api.put(`/api/team/contracts/${id}`, contractData);
  },

  // 获取即将到期的合同
  getExpiringContracts: (days: number = 30): Promise<ApiResponse<Contract[]>> => {
    return api.get(`/api/team/contracts/expiring?days=${days}`);
  },
};

// 项目管理 API
export const projectApi = {
  // 获取项目列表
  getProjects: (): Promise<ApiResponse<Project[]>> => {
    return api.get('/api/projects');
  },

  // 获取单个项目
  getProject: (id: string): Promise<ApiResponse<Project>> => {
    return api.get(`/api/projects/${id}`);
  },

  // 创建项目
  createProject: (projectData: {
    name: string;
    description: string;
  }): Promise<ApiResponse<Project>> => {
    return api.post('/api/projects', projectData);
  },

  // 更新项目
  updateProject: (id: string, projectData: Partial<Project>): Promise<ApiResponse<Project>> => {
    return api.put(`/api/projects/${id}`, projectData);
  },

  // 删除项目
  deleteProject: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/projects/${id}`);
  },

  // 获取项目成员
  getProjectMembers: (projectId: string): Promise<ApiResponse<User[]>> => {
    return api.get(`/api/projects/${projectId}/members`);
  },

  // 添加项目成员
  addProjectMember: (projectId: string, userId: string): Promise<ApiResponse<null>> => {
    return api.post(`/api/projects/${projectId}/members`, { user_id: userId });
  },

  // 移除项目成员
  removeProjectMember: (projectId: string, userId: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/projects/${projectId}/members/${userId}`);
  },

  // 获取团队公告板
  getTeamBoard: (): Promise<ApiResponse<{
    projects: Project[];
    public_tasks: Task[];
  }>> => {
    return api.get('/api/projects/board');
  },
};

// 任务管理 API
export const taskApi = {
  // 获取我的任务
  getMyTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/api/tasks/my');
  },

  // 获取已指派的任务
  getAssignedTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/api/tasks/assigned');
  },

  // 获取私有任务
  getPrivateTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/api/tasks/private');
  },

  // 获取项目任务
  getProjectTasks: (projectId: string): Promise<ApiResponse<Task[]>> => {
    return api.get(`/api/projects/${projectId}/tasks`);
  },

  // 创建任务
  createTask: (taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    assigned_to?: string;
    project_id?: string;
    parent_task_id?: string;
  }): Promise<ApiResponse<Task>> => {
    return api.post('/api/tasks', taskData);
  },

  // 更新任务
  updateTask: (id: string, taskData: Partial<Task>): Promise<ApiResponse<Task>> => {
    return api.put(`/api/tasks/${id}`, taskData);
  },

  // 更新任务状态
  updateTaskStatus: (id: string, status: 'todo' | 'in_progress' | 'completed'): Promise<ApiResponse<Task>> => {
    return api.patch(`/api/tasks/${id}/status`, { status });
  },

  // 删除任务
  deleteTask: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/tasks/${id}`);
  },

  // 获取子任务
  getSubTasks: (taskId: string): Promise<ApiResponse<Task[]>> => {
    return api.get(`/api/tasks/${taskId}/subtasks`);
  },
};

// 日记系统 API
export const diaryApi = {
  // 获取我的日记
  getMyDiaries: (params?: {
    page?: number;
    limit?: number;
    visibility?: string;
  }): Promise<ApiResponse<{
    diaries: Diary[];
    total: number;
    page: number;
    limit: number;
  }>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.visibility) searchParams.append('visibility', params.visibility);

    const query = searchParams.toString();
    return api.get(`/api/diaries/my${query ? `?${query}` : ''}`);
  },

  // 获取共享日记
  getSharedDiaries: (): Promise<ApiResponse<Diary[]>> => {
    return api.get('/api/diaries/shared');
  },

  // 获取单个日记
  getDiary: (id: string): Promise<ApiResponse<Diary>> => {
    return api.get(`/api/diaries/${id}`);
  },

  // 创建日记
  createDiary: (diaryData: {
    title: string;
    content: string;
    visibility: 'public' | 'project' | 'private' | 'members';
    shared_with?: string[];
    project_id?: string;
  }): Promise<ApiResponse<Diary>> => {
    return api.post('/api/diaries', diaryData);
  },

  // 更新日记
  updateDiary: (id: string, diaryData: Partial<Diary>): Promise<ApiResponse<Diary>> => {
    return api.put(`/api/diaries/${id}`, diaryData);
  },

  // 删除日记
  deleteDiary: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/diaries/${id}`);
  },

  // 分享日记
  shareDiary: (id: string, shareData: {
    visibility: 'public' | 'project' | 'members';
    shared_with?: string[];
    project_id?: string;
  }): Promise<ApiResponse<Diary>> => {
    return api.post(`/api/diaries/${id}/share`, shareData);
  },
};

// 消息中心 API
export const messageApi = {
  // 获取消息列表
  getMessages: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
  }): Promise<ApiResponse<{
    messages: any[];
    total: number;
    page: number;
    limit: number;
  }>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);
    if (params?.read !== undefined) searchParams.append('read', params.read.toString());

    const query = searchParams.toString();
    return api.get(`/api/messages${query ? `?${query}` : ''}`);
  },

  // 标记消息为已读
  markAsRead: (messageId: string): Promise<ApiResponse<null>> => {
    return api.patch(`/api/messages/${messageId}/read`);
  },

  // 标记所有消息为已读
  markAllAsRead: (): Promise<ApiResponse<null>> => {
    return api.patch('/api/messages/read-all');
  },

  // 删除消息
  deleteMessage: (messageId: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/messages/${messageId}`);
  },
};

// 微信扫码登录 API
export const wechatAuthApi = {
  // 生成微信登录二维码和key
  generate: (redirect?: string) =>
    api.post('/api/auth/wechat/generate', redirect ? { redirect } : undefined),

  // 轮询扫码状态
  getStatus: (key: string) =>
    api.get(`/api/auth/wechat/status/${key}`),

  // 凭 code 获取 openid 并登录
  getOpenid: (code: string) =>
    api.get(`/api/auth/wechat/openid?code=${code}`),
}; 