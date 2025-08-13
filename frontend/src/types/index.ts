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

// 扩展项目类型以包含成员信息
export interface ProjectWithMembers extends Project {
  user_ids?: number[];
  task_count?: number;
  completed_task_count?: number;
}

// 项目操作相关类型
export interface CreateProjectData {
  name: string;
  description: string;
  user_ids?: number[];
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  user_ids?: number[];
  status?: 'active' | 'archived';
}

// 项目查询参数
export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'archived';
  keyword?: string;
  member_id?: number;
}

// 任务相关类型
export interface Subtask {
  id: string;
  title: string;
  content: string;
  assignee?: string;  // 显示用的用户名
  assignee_id?: number;  // 存储用的用户ID
  parentId?: string;
  children?: Subtask[];
  created_at?: string;  // 创建时间
}

export interface TaskFlow {
  id: string;
  fromUser: string;
  toUser: string;
  action: 'transfer' | 'complete';
  notes: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  content: string;
  currentAssignee: string;
  originalAssignee: string;
  startDate: string;
  endDate: string;
  progress: number;
  project?: string;
  priority: 'low' | 'medium' | 'high';
  subtasks: Subtask[];
  completionNotes?: string;
  flowHistory: TaskFlow[];
  createdBy: string;
  createdAt: string;
  // 添加原始ID字段，用于编辑表单
  assignee_id?: number;
  project_id?: number;
}

// 任务操作相关类型
export interface CreateTaskData {
  title: string;
  content: string;
  currentAssignee: string;
  startDate: string;
  endDate: string;
  project?: string;
  priority: 'low' | 'medium' | 'high';
  subtasks?: Subtask[];
}

export interface UpdateTaskData {
  title?: string;
  content?: string;
  currentAssignee?: string;
  startDate?: string;
  endDate?: string;
  project?: string;
  priority?: 'low' | 'medium' | 'high';
  subtasks?: Subtask[];
}

export interface TransferTaskData {
  toUser: string;
  notes: string;
  action: 'transfer' | 'complete';
}

// 任务查询参数
export interface TaskQueryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  project?: string;
  keyword?: string;
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

// 消息中心相关类型（用于创建消息与返回值）
export type MessageLevel = 'info' | 'warning' | 'error';

export interface MessageCreateData {
  type: string;
  level?: MessageLevel;
  title: string;
  content?: string;
  entity_type?: 'contract' | 'document' | 'task' | 'project';
  entity_id?: number;
  actor_id?: number;
  data_json?: string;
  recipient_user_ids: number[];
}

export interface MessageResponse {
  id: number;
  type: string;
  level: MessageLevel;
  title: string;
  content?: string;
  entity_type?: 'contract' | 'document' | 'task' | 'project';
  entity_id?: number;
  actor_id?: number;
  data_json?: string;
  created_at: string;
}

// 我的通知（后端 /api/message/my 返回项）
export interface UserNotification {
  id: number; // recipient_id
  type: string;
  level: MessageLevel;
  title: string;
  content?: string;
  entity_type?: 'contract' | 'document' | 'task' | 'project';
  entity_id?: number;
  actor_id?: number;
  actor_name?: string | null;
  data_json?: string | null;
  created_at: string; // message.created_at
  read: boolean;
  read_at?: string | null;
  delivered_at: string;
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