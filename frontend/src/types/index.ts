// 统一的类型定义文件
// 所有业务相关的类型都在这里定义，避免重复

// 用户相关类型
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

// 项目相关类型
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 任务相关类型
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

// 日记相关类型
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

// 合同相关类型
export interface Contract {
  id: string;
  user_id: string;
  hire_date: string;
  expire_date: string;
  status: 'active' | 'expired' | 'terminated';
  created_at: string;
  updated_at: string;
}

// 消息相关类型
export interface Message {
  id: string;
  title: string;
  content: string;
  type: 'notification' | 'announcement' | 'reminder';
  read: boolean;
  created_at: string;
  updated_at: string;
}

// 文档相关类型定义
export interface Document {
  id: number;
  title: string;
  content: string;
  visibility: 'public' | 'project' | 'private' | 'specific';
  created_at: string;
  updated_at: string;
  author_id: number;
  author_name?: string;
  author_avatar?: string;
  // 关联信息（用于默认选中）
  project_id?: number;
  specific_user_ids?: number[];
}

export interface DocumentComment {
  id: number;
  document_id: number;
  author_id: number;
  author_name?: string;
  author_avatar?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// 文档操作相关类型
export interface CreateDocumentData {
  title: string;
  content: string;
  project_id?: number;
  user_ids?: number[];
}

export interface UpdateDocumentData {
  title: string;
  content: string;
  project_id?: number;
  user_ids?: number[];
}

export interface AddCommentData {
  document_id: number;
  content: string;
}

export interface DocumentQueryParams {
  skip?: number;
  limit?: number;
  visibility?: 'public' | 'project' | 'private' | 'specific';
  order_by?: string;
}

// 文件上传相关类型
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

// 通用状态管理类型
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => void;
  setData: (data: T) => void;
} 