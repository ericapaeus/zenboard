import { api } from '@/utils/api';
import type { ApiResponse } from '@/utils/api';
import type { 
  User, 
  Project, 
  Task, 
  Diary, 
  Contract, 
  Document, 
  DocumentComment 
} from '@/types';

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
    avatar?: string;
    role?: string;
  }): Promise<ApiResponse<User>> => {
    return api.put('/api/auth/wechat/profile', data);
  },

  // 检查是否为系统首个用户
  checkFirstUser: (): Promise<ApiResponse<{ isFirstUser: boolean }>> => {
    return api.get('/api/auth/wechat/check-first-user');
  },

  // 获取用户列表
  getUsers: (): Promise<ApiResponse<User[]>> => {
    return api.get('/api/auth/wechat/user');
  },

  // 审批用户
  approveUser: (userId: string): Promise<ApiResponse<{ user_id: number; status: string }>> => {
    return api.post(`/api/auth/wechat/user/${userId}/approve`);
  },

  // 拒绝用户
  rejectUser: (userId: string): Promise<ApiResponse<{ user_id: number; status: string }>> => {
    return api.post(`/api/auth/wechat/user/${userId}/reject`);
  },

  // 更新用户信息
  updateUser: (userId: number, data: {
    name?: string;
    phone?: string;
    email?: string;
    hire_date?: string;
    contract_expiry?: string;
  }): Promise<ApiResponse<User>> => {
    return api.put(`/api/auth/wechat/user/${userId}`, data);
  },

  // 删除用户
  deleteUser: (userId: number): Promise<ApiResponse<{ user_id: number; deleted: boolean }>> => {
    return api.delete(`/api/auth/wechat/user/${userId}`);
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
    return api.get(`/api/user${query ? `?${query}` : ''}`);
  },

  // 获取单个用户
  getUser: (id: string): Promise<ApiResponse<User>> => {
    return api.get(`/api/user/${id}`);
  },

  // 创建用户
  createUser: (userData: {
    username: string;
    nickname: string;
    phone: string;
    role: string;
  }): Promise<ApiResponse<User>> => {
    return api.post('/api/user', userData);
  },

  // 更新用户
  updateUser: (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    return api.put(`/api/auth/wechat/user/${id}`, userData);
  },

  // 删除用户
  deleteUser: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/auth/wechat/user/${id}`);
  },

  // 更新用户状态
  updateUserStatus: (id: string, status: 'active' | 'inactive'): Promise<ApiResponse<User>> => {
    return api.patch(`/api/user/${id}/status`, { status });
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
    return api.get('/api/project');
  },

  // 获取单个项目
  getProject: (id: string): Promise<ApiResponse<Project>> => {
    return api.get(`/api/project/${id}`);
  },

  // 创建项目
  createProject: (projectData: {
    name: string;
    description: string;
  }): Promise<ApiResponse<Project>> => {
    return api.post('/api/project', projectData);
  },

  // 更新项目
  updateProject: (id: string, projectData: Partial<Project>): Promise<ApiResponse<Project>> => {
    return api.put(`/api/project/${id}`, projectData);
  },

  // 删除项目
  deleteProject: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/project/${id}`);
  },

  // 获取项目成员
  getProjectMembers: (projectId: string): Promise<ApiResponse<User[]>> => {
    return api.get(`/api/project/${projectId}/members`);
  },

  // 添加项目成员
  addProjectMember: (projectId: string, userId: string): Promise<ApiResponse<null>> => {
    return api.post(`/api/project/${projectId}/members`, { user_id: userId });
  },

  // 移除项目成员
  removeProjectMember: (projectId: string, userId: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/project/${projectId}/members/${userId}`);
  },

  // 获取团队公告板
  getTeamBoard: (): Promise<ApiResponse<{
    projects: Project[];
    public_tasks: Task[];
  }>> => {
    return api.get('/api/project/board');
  },
};

// 任务管理 API
export const taskApi = {
  // 获取我的任务
  getMyTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/api/task/my');
  },

  // 获取已指派的任务
  getAssignedTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/api/task/assigned');
  },

  // 获取私有任务
  getPrivateTasks: (): Promise<ApiResponse<Task[]>> => {
    return api.get('/api/task/private');
  },

  // 获取项目任务
  getProjectTasks: (projectId: string): Promise<ApiResponse<Task[]>> => {
    return api.get(`/api/project/${projectId}/tasks`);
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
    return api.post('/api/task', taskData);
  },

  // 更新任务
  updateTask: (id: string, taskData: Partial<Task>): Promise<ApiResponse<Task>> => {
    return api.put(`/api/task/${id}`, taskData);
  },

  // 更新任务状态
  updateTaskStatus: (id: string, status: 'todo' | 'in_progress' | 'completed'): Promise<ApiResponse<Task>> => {
    return api.patch(`/api/task/${id}/status`, { status });
  },

  // 删除任务
  deleteTask: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/task/${id}`);
  },

  // 获取子任务
  getSubTasks: (taskId: string): Promise<ApiResponse<Task[]>> => {
    return api.get(`/api/task/${taskId}/subtasks`);
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
    return api.get(`/api/diary/my${query ? `?${query}` : ''}`);
  },

  // 获取共享日记
  getSharedDiaries: (): Promise<ApiResponse<Diary[]>> => {
    return api.get('/api/diary/shared');
  },

  // 获取单个日记
  getDiary: (id: string): Promise<ApiResponse<Diary>> => {
    return api.get(`/api/diary/${id}`);
  },

  // 创建日记
  createDiary: (diaryData: {
    title: string;
    content: string;
    visibility: 'public' | 'project' | 'private' | 'members';
    shared_with?: string[];
    project_id?: string;
  }): Promise<ApiResponse<Diary>> => {
    return api.post('/api/diary', diaryData);
  },

  // 更新日记
  updateDiary: (id: string, diaryData: Partial<Diary>): Promise<ApiResponse<Diary>> => {
    return api.put(`/api/diary/${id}`, diaryData);
  },

  // 删除日记
  deleteDiary: (id: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/diary/${id}`);
  },

  // 分享日记
  shareDiary: (id: string, shareData: {
    visibility: 'public' | 'project' | 'members';
    shared_with?: string[];
    project_id?: string;
  }): Promise<ApiResponse<Diary>> => {
    return api.post(`/api/diary/${id}/share`, shareData);
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
    return api.get(`/api/document${query ? `?${query}` : ''}`);
  },
  // 获取文档详情
  getDocument: (id: number): Promise<ApiResponse<Document>> => api.get(`/api/document/${id}`),
  // 创建文档（支持项目与指定用户）
  createDocument: (data: { title: string; content: string; project_id?: number; user_ids?: number[]; visibility?: 'public' | 'project' | 'specific' | 'private'; }): Promise<ApiResponse<Document>> => api.post('/api/document', data),
  // 更新文档（支持项目与指定用户）
  updateDocument: (id: number, data: Partial<{ title: string; content: string; project_id?: number; user_ids?: number[]; visibility?: 'public' | 'project' | 'specific' | 'private'; }>): Promise<ApiResponse<Document>> => api.put(`/api/document/${id}`, data),
  // 删除文档
  deleteDocument: (id: number): Promise<ApiResponse<null>> => api.delete(`/api/document/${id}`),
};

// 文档评论 API（新）
export const documentCommentApi = {
  listByDocument: (documentId: number): Promise<ApiResponse<DocumentComment[]>> => api.get(`/api/document-comment/by-document/${documentId}`),
  addComment: (payload: { document_id: number; content: string; }): Promise<ApiResponse<DocumentComment>> => api.post('/api/document-comment', payload),
  deleteComment: (commentId: number): Promise<ApiResponse<null>> => api.delete(`/api/document-comment/${commentId}`),
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
    return api.get(`/api/message${query ? `?${query}` : ''}`);
  },

  // 标记消息为已读
  markAsRead: (messageId: string): Promise<ApiResponse<null>> => {
    return api.patch(`/api/message/${messageId}/read`);
  },

  // 标记所有消息为已读
  markAllAsRead: (): Promise<ApiResponse<null>> => {
    return api.patch('/api/message/read-all');
  },

  // 删除消息
  deleteMessage: (messageId: string): Promise<ApiResponse<null>> => {
    return api.delete(`/api/message/${messageId}`);
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
    return api.post('/api/upload/file', formData);
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