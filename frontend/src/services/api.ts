import { api } from '@/utils/api';
import type { ApiResponse } from '@/utils/api';
import type { 
  User, 
  Project, 
  Task, 
  Contract, 
  Document, 
  DocumentComment,
  CreateProjectData,
  UpdateProjectData
} from '@/types';

// 添加评论类型定义
export interface Comment {
  id: number;
  content: string;
  author_id: number;
  author_name?: string;
  task_id?: number;
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
    return api.post('/auth/login', { qr_code: qrCode }, { skipAuth: true });
  },

  // 刷新 token
  refresh: (refreshToken: string): Promise<ApiResponse<{
    access_token: string;
    refresh_token: string;
    token_type: string;
  }>> => {
    return api.post('/auth/refresh', { refresh_token: refreshToken }, { skipAuth: true });
  },

  // 退出登录
  logout: (): Promise<ApiResponse<null>> => {
    return api.post('/auth/logout');
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<User>> => {
    return api.get('/auth/wechat/me');
  },

  // 更新用户资料
  updateProfile: (data: {
    name?: string;
    phone?: string;
    email?: string;
    hire_date?: Date;
    contract_expiry?: Date;
    status?: string;
    avatar?: string;
    role?: string;
  }): Promise<ApiResponse<User>> => {
    return api.put('/auth/wechat/profile', data);
  },

  // 检查是否为系统首个用户
  checkFirstUser: (): Promise<ApiResponse<{ isFirstUser: boolean }>> => {
    return api.get('/auth/wechat/check-first-user');
  },

  // 获取用户列表
  getUsers: (): Promise<ApiResponse<User[]>> => {
    return api.get('/auth/wechat/user');
  },

  // 审批用户
  approveUser: (userId: string): Promise<ApiResponse<{ user_id: number; status: string }>> => {
    return api.post(`/auth/wechat/user/${userId}/approve`);
  },

  // 拒绝用户
  rejectUser: (userId: string): Promise<ApiResponse<{ user_id: number; status: string }>> => {
    return api.post(`/auth/wechat/user/${userId}/reject`);
  },

  // 更新用户信息
  updateUser: (userId: number, data: {
    name?: string;
    phone?: string;
    email?: string;
    hire_date?: string;
    contract_expiry?: string;
  }): Promise<ApiResponse<User>> => {
    return api.put(`/auth/wechat/user/${userId}`, data);
  },

  // 删除用户
  deleteUser: (userId: number): Promise<ApiResponse<{ user_id: number; deleted: boolean }>> => {
    return api.delete(`/auth/wechat/user/${userId}`);
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
    return api.get(`/user${query ? `?${query}` : ''}`);
  },

  // 获取单个用户
  getUser: (id: string): Promise<ApiResponse<User>> => {
    return api.get(`/user/${id}`);
  },

  // 创建用户
  createUser: (userData: {
    username: string;
    nickname: string;
    phone: string;
    role: string;
  }): Promise<ApiResponse<User>> => {
    return api.post('/user', userData);
  },

  // 更新用户
  updateUser: (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    return api.put(`/auth/wechat/user/${id}`, userData);
  },

  // 删除用户
  deleteUser: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/auth/wechat/user/${id}`);
  },

  // 更新用户状态
  updateUserStatus: (id: string, status: 'active' | 'inactive'): Promise<ApiResponse<User>> => {
    return api.patch(`/user/${id}/status`, { status });
  },
};

// 团队管理 API
export const teamApi = {
  // 获取团队成员
  getMembers: (): Promise<ApiResponse<User[]>> => {
    return api.get('/team/members');
  },

  // 获取待审批用户
  getPendingApprovals: (): Promise<ApiResponse<User[]>> => {
    return api.get('/team/approvals/pending');
  },

  // 审批用户
  approveUser: (userId: string, approved: boolean, reason?: string): Promise<ApiResponse<User>> => {
    return api.post(`/team/approvals/${userId}`, { approved, reason });
  },

  // 获取合同列表
  getContracts: (): Promise<ApiResponse<Contract[]>> => {
    return api.get('/team/contracts');
  },

  // 创建合同
  createContract: (contractData: {
    user_id: string;
    hire_date: string;
    expire_date: string;
  }): Promise<ApiResponse<Contract>> => {
    return api.post('/team/contracts', contractData);
  },

  // 更新合同
  updateContract: (id: string, contractData: Partial<Contract>): Promise<ApiResponse<Contract>> => {
    return api.put(`/team/contracts/${id}`, contractData);
  },

  // 获取即将到期的合同
  getExpiringContracts: (days: number = 30): Promise<ApiResponse<Contract[]>> => {
    return api.get(`/team/contracts/expiring?days=${days}`);
  },
};

// 项目管理 API
export const projectApi = {
  // 获取项目列表
  getProjects: (): Promise<ApiResponse<Project[]>> => {
    return api.get('/project');
  },

  // 获取单个项目
  getProject: (id: string): Promise<ApiResponse<Project>> => {
    return api.get(`/project/${id}`);
  },

  // 创建项目
  createProject: (projectData: CreateProjectData): Promise<ApiResponse<Project>> => {
    return api.post('/project', projectData);
  },

  // 更新项目
  updateProject: (id: string, projectData: UpdateProjectData): Promise<ApiResponse<Project>> => {
    return api.put(`/project/${id}`, projectData);
  },

  // 删除项目
  deleteProject: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/project/${id}`);
  },

  // 获取项目成员
  getProjectMembers: (projectId: string): Promise<ApiResponse<User[]>> => {
    return api.get(`/project/${projectId}/members`);
  },

  // 添加项目成员
  addProjectMember: (projectId: string, userId: string): Promise<ApiResponse<null>> => {
    return api.post(`/project/${projectId}/members`, { user_id: userId });
  },

  // 移除项目成员
  removeProjectMember: (projectId: string, userId: string): Promise<ApiResponse<null>> => {
    return api.delete(`/project/${projectId}/members/${userId}`);
  },

  // 获取团队公告板
  getTeamBoard: (): Promise<ApiResponse<{
    projects: Project[];
    public_tasks: Task[];
  }>> => {
    return api.get('/project/board');
  },
};

// 任务管理 API
export const taskApi = {
  // 通用列表（对接后端 GET /api/task）
  getTasks: (params?: { skip?: number; limit?: number; project_id?: number; status_filter?: string; assignee_id?: number; }): Promise<ApiResponse<Task[]>> => {
    const sp = new URLSearchParams();
    if (params?.skip !== undefined) sp.append('skip', String(params.skip));
    if (params?.limit !== undefined) sp.append('limit', String(params.limit));
    if (params?.project_id !== undefined) sp.append('project_id', String(params.project_id));
    if (params?.status_filter !== undefined) sp.append('status_filter', params.status_filter);
    if (params?.assignee_id !== undefined) sp.append('assignee_id', String(params.assignee_id));
    const q = sp.toString();
    return api.get(`/task${q ? `?${q}` : ''}`);
  },

  // 获取我的任务
  getMyTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/task/my');
  },

  // 获取已指派的任务
  getAssignedTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/task/assigned');
  },

  // 获取私有任务
  getPrivateTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/task/private');
  },

  // 获取项目任务
  getProjectTasks: (projectId: string): Promise<ApiResponse<Task[]>> => {
    return api.get(`/project/${projectId}/tasks`);
  },

  // 创建任务（对接后端 /api/task）
  createTask: (taskData: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    assignee_id?: number;
    project_id?: number;
    parent_task_id?: number;
    start_date?: string;
    end_date?: string;
    subtasks?: any[];
  }): Promise<ApiResponse<Task>> => {
    return api.post('/task', taskData);
  },

  // 更新任务
  updateTask: (id: number, taskData: Partial<{ title: string; content: string; priority: 'low' | 'medium' | 'high'; assignee_id?: number; project_id?: number; parent_task_id?: number; status?: 'pending' | 'completed'; start_date?: string; end_date?: string; subtasks?: any[]; }>): Promise<ApiResponse<Task>> => {
    return api.put(`/task/${id}`, taskData);
  },

  // 更新任务状态
  updateTaskStatus: (id: string, status: 'todo' | 'in_progress' | 'completed'): Promise<ApiResponse<Task>> => {
    return api.patch(`/task/${id}/status`, { status });
  },

  // 删除任务
  deleteTask: (id: number): Promise<ApiResponse<null>> => {
    return api.delete(`/task/${id}`);
  },

  // 获取子任务
  getSubTasks: (taskId: string): Promise<ApiResponse<Task[]>> => {
    return api.get(`/task/${taskId}/subtasks`);
  },

  // 获取任务评论
  getTaskComments: (taskId: number, params?: { skip?: number; limit?: number }): Promise<ApiResponse<Comment[]>> => {
    const sp = new URLSearchParams();
    if (params?.skip !== undefined) sp.append('skip', String(params.skip));
    if (params?.limit !== undefined) sp.append('limit', String(params.limit));
    const q = sp.toString();
    return api.get(`/task/${taskId}/comments${q ? `?${q}` : ''}`);
  },

  // 创建评论
  createComment: (data: { content: string; task_id?: number }): Promise<ApiResponse<Comment>> => {
    return api.post('/comment/', data);
  },

  // 更新评论
  updateComment: (commentId: number, data: { content: string }): Promise<ApiResponse<Comment>> => {
    return api.put(`/comment/${commentId}`, data);
  },

  // 删除评论
  deleteComment: (commentId: number): Promise<ApiResponse<null>> => {
    return api.delete(`/comment/${commentId}`);
  },
};

// 文档系统 API（新）
export const documentApi = {
  // 获取文档列表
  getDocuments: (params?: { skip?: number; limit?: number; author_id?: number; visibility?: 'public' | 'project' | 'specific' | 'private'; order_by?: string; }): Promise<ApiResponse<Document[]>> => {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', String(params.skip));
    if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params?.author_id !== undefined) searchParams.append('author_id', String(params.author_id));
    if (params?.visibility !== undefined) searchParams.append('visibility', params.visibility);
    if (params?.order_by !== undefined) searchParams.append('order_by', params.order_by);
    const query = searchParams.toString();
    return api.get(`/document${query ? `?${query}` : ''}`);
  },
  // 获取文档详情
  getDocument: (id: number): Promise<ApiResponse<Document>> => api.get(`/document/${id}`),
  // 创建文档（支持项目与指定用户）
  createDocument: (data: { title: string; content: string; project_id?: number; user_ids?: number[]; visibility?: 'public' | 'project' | 'specific' | 'private'; }): Promise<ApiResponse<Document>> => api.post('/document', data),
  // 更新文档（支持项目与指定用户）
  updateDocument: (id: number, data: Partial<{ title: string; content: string; project_id?: number; user_ids?: number[]; visibility?: 'public' | 'project' | 'specific' | 'private'; }>): Promise<ApiResponse<Document>> => api.put(`/document/${id}`, data),
  // 删除文档
  deleteDocument: (id: number): Promise<ApiResponse<null>> => api.delete(`/document/${id}`),
};

// 文档评论 API（新）
export const documentCommentApi = {
  listByDocument: (documentId: number): Promise<ApiResponse<DocumentComment[]>> => api.get(`/document-comment/by-document/${documentId}`),
  addComment: (payload: { document_id: number; content: string; }): Promise<ApiResponse<DocumentComment>> => api.post('/document-comment', payload),
  deleteComment: (commentId: number): Promise<ApiResponse<null>> => api.delete(`/document-comment/${commentId}`),
};

// 消息中心 API
export const messageApi = {
  // 旧：通用消息列表（保留以兼容其他页面）
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
    return api.get(`/message${query ? `?${query}` : ''}`);
  },

  // 新：我的通知列表（对接后端 /api/message/my）
  listMy: (params?: { read?: boolean; skip?: number; limit?: number; }): Promise<ApiResponse<import('@/types').UserNotification[]>> => {
    const sp = new URLSearchParams();
    if (params?.read !== undefined) sp.append('read', String(params.read));
    if (params?.skip !== undefined) sp.append('skip', String(params.skip));
    if (params?.limit !== undefined) sp.append('limit', String(params.limit));
    const q = sp.toString();
    return api.get(`/message/my${q ? `?${q}` : ''}`);
  },

  // 新：未读数量
  unreadCount: (): Promise<ApiResponse<number>> => api.get('/message/my/unread-count'),

  // 创建消息（投递给接收人）
  createMessage: (data: import('@/types').MessageCreateData): Promise<ApiResponse<import('@/types').MessageResponse>> => {
    return api.post('/message', data);
  },

  // 新：标记单条为已读（对接 /api/message/my/{recipient_id}/read）
  markRead: (recipientId: number): Promise<ApiResponse<{ id: number; read: boolean }>> => {
    return api.post(`/message/my/${recipientId}/read`);
  },

  // 新：全部标记为已读（对接 /api/message/my/read-all）
  markAllRead: (): Promise<ApiResponse<{ affected: number }>> => {
    return api.post('/message/my/read-all');
  },

  // 旧：删除消息（保留兼容）
  deleteMessage: (messageId: string): Promise<ApiResponse<null>> => {
    return api.delete(`/message/${messageId}`);
  },
};

// 微信扫码登录 API
export const wechatAuthApi = {
  // 生成微信登录二维码和key
  generate: (redirect?: string) =>
    api.post('/auth/wechat/generate', redirect ? { redirect } : undefined),

  // 轮询扫码状态
  getStatus: (key: string) =>
    api.get(`/auth/wechat/status/${key}`),

  // 凭 code 获取 openid 并登录
  getOpenid: (code: string) =>
    api.get(`/auth/wechat/openid?code=${code}`),
};

// 文件上传 API
export const uploadApi = {
  // 上传文件（通用）
  uploadFile: (file: File, type: 'avatar' | 'document' | 'image' = 'image'): Promise<ApiResponse<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    // 注意：不要手动设置 Content-Type，让浏览器自动处理 multipart/form-data 的 boundary
    return api.post('/upload/file', formData);
  },

  // 上传头像（专门用于头像上传）
  uploadAvatar: (file: File): Promise<ApiResponse<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>> => {
    return uploadApi.uploadFile(file, 'avatar');
  },

  // 上传文档
  uploadDocument: (file: File): Promise<ApiResponse<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>> => {
    return uploadApi.uploadFile(file, 'document');
  },
}; 