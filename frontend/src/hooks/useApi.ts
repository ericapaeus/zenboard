import { useState, useEffect, useCallback, useRef } from 'react';
import { message, Modal } from 'antd';
import { authApi, userApi, teamApi, projectApi, taskApi, diaryApi, messageApi, uploadApi, documentApi, documentCommentApi, wechatAuthApi } from '@/services/api';
import type { ApiResponse } from '@/utils/api';

// ==================== 统一类型定义 ====================

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
  visibility: 'public' | 'project' | 'private' | 'specific';
}

export interface UpdateDocumentData {
  title: string;
  content: string;
  visibility: 'public' | 'project' | 'private' | 'specific';
}

export interface AddCommentData {
  document_id: number;
  content: string;
}

// 文档查询参数类型
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

// 通用 API Hook 类型
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => void;
  setData: (data: T) => void;
}

// ==================== 通用 API Hook ====================

// 通用 API Hook - React 19 兼容版本
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // 使用 useRef 来稳定 apiCall 引用，避免无限重新渲染
  const apiCallRef = useRef(apiCall);
  
  // 只在 apiCall 函数引用真正改变时更新
  useEffect(() => {
    apiCallRef.current = apiCall;
  }, [apiCall]);

  // 使用 useRef 来跟踪组件是否已卸载
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      // 检查组件是否已卸载
      if (!isMountedRef.current) return;
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await apiCallRef.current();
      
      // 再次检查组件是否已卸载
      if (!isMountedRef.current) return;
      
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.message || '请求失败',
        });
        // 只在组件仍然挂载时显示错误消息
        if (isMountedRef.current) {
          message.error(response.message || '请求失败');
        }
      }
    } catch (error) {
      // 再次检查组件是否已卸载
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : '网络错误';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      // 只在组件仍然挂载时显示错误消息
      if (isMountedRef.current) {
        message.error(errorMessage);
      }
    }
  }, []); // 保持空依赖数组，因为使用 apiCallRef.current

  const refetch = useCallback(() => {
    if (isMountedRef.current) {
      fetchData();
    }
  }, [fetchData]);

  const setData = useCallback((data: T) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, data }));
    }
  }, []);

  // React 19 兼容的 useEffect - 修复循环依赖
  useEffect(() => {
    isMountedRef.current = true;
    
    // 使用 Promise.resolve().then() 来确保异步操作在下一个微任务中执行
    Promise.resolve().then(() => {
      if (isMountedRef.current) {
        fetchData();
      }
    });
    
    // 清理函数
    return () => {
      isMountedRef.current = false;
    };
  }, []); // 移除 dependencies 依赖，避免循环

  // 单独处理 dependencies 变化时的重新获取
  useEffect(() => {
    if (dependencies.length > 0 && isMountedRef.current) {
      // 延迟执行，避免在依赖变化时立即触发
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          fetchData();
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, dependencies);

  return {
    ...state,
    refetch,
    setData,
  };
}

// ==================== 认证相关 Hooks ====================

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);

  // 使用useEffect处理message显示
  useEffect(() => {
    if (pendingMessage) {
      if (pendingMessage.type === 'success') {
        message.success(pendingMessage.content);
      } else {
        message.error(pendingMessage.content);
      }
      setPendingMessage(null);
    }
  }, [pendingMessage]);

  const showMessage = (type: 'success' | 'error', content: string) => {
    setPendingMessage({ type, content });
  };

  const login = async (qrCode: string) => {
    setLoading(true);
    try {
      const response = await authApi.login(qrCode);
      if (response.success) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        localStorage.setItem('isLogin', '1');
        setUser(response.data.user);
        showMessage('success', '登录成功！');
        return response.data;
      } else {
        showMessage('error', response.message || '登录失败');
        throw new Error(response.message);
      }
    } catch (error) {
      showMessage('error', '登录失败，请重试');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('isLogin');
      setUser(null);
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success) {
        setUser(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Get current user error:', error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    getCurrentUser,
  };
};

// ==================== 用户管理 Hooks ====================

// 用户管理 Hooks - 修复版本
export const useUsers = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
}) => {
  // 使用 useMemo 来稳定 params 对象引用
  const stableParams = useRef(params);
  stableParams.current = params;
  
  return useApi(
    () => userApi.getUsers(stableParams.current),
    [params?.page, params?.limit, params?.status, params?.role]
  );
};

// 使用authApi获取用户列表的Hook
export const useAuthUsers = () => {
  return useApi(() => authApi.getUsers());
};

// 审批用户Hook
export const useApproveUser = () => {
  const [loading, setLoading] = useState(false);
  
  const approveUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await authApi.approveUser(userId);
      if (response.success) {
        message.success('用户审批成功');
        return response;
      } else {
        message.error(response.message || '审批失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('审批失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { approveUser, loading };
};

// 拒绝用户Hook
export const useRejectUser = () => {
  const [loading, setLoading] = useState(false);
  
  const rejectUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await authApi.rejectUser(userId);
      if (response.success) {
        message.success('用户拒绝成功');
        return response;
      } else {
        message.error(response.message || '拒绝失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('拒绝失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { rejectUser, loading };
};

export const useUser = (id: string) => {
  return useApi(
    () => userApi.getUser(id),
    [id]
  );
};

// ==================== 团队管理 Hooks ====================

export const useTeamMembers = () => {
  return useApi(() => teamApi.getMembers());
};

export const usePendingApprovals = () => {
  return useApi(() => teamApi.getPendingApprovals());
};

export const useContracts = () => {
  return useApi(() => teamApi.getContracts());
};

export const useExpiringContracts = (days: number = 30) => {
  return useApi(
    () => teamApi.getExpiringContracts(days),
    [days]
  );
};

// ==================== 项目管理 Hooks ====================

export const useProjects = () => {
  return useApi(() => projectApi.getProjects());
};

export const useProject = (id: string) => {
  return useApi(
    () => projectApi.getProject(id),
    [id]
  );
};

export const useProjectMembers = (projectId: string) => {
  return useApi(
    () => projectApi.getProjectMembers(projectId),
    [projectId]
  );
};

export const useTeamBoard = () => {
  return useApi(() => projectApi.getTeamBoard());
};

// ==================== 任务管理 Hooks ====================

export const useMyTasks = () => {
  return useApi(() => taskApi.getMyTasks());
};

export const useAssignedTasks = () => {
  return useApi(() => taskApi.getAssignedTasks());
};

export const usePrivateTasks = () => {
  return useApi(() => taskApi.getPrivateTasks());
};

export const useProjectTasks = (projectId: string) => {
  return useApi(
    () => taskApi.getProjectTasks(projectId),
    [projectId]
  );
};

export const useSubTasks = (taskId: string) => {
  return useApi(
    () => taskApi.getSubTasks(taskId),
    [taskId]
  );
};

// ==================== 日记系统 Hooks ====================

export const useMyDiaries = (params?: {
  page?: number;
  limit?: number;
  visibility?: string;
}) => {
  return useApi(
    () => diaryApi.getMyDiaries(params),
    [params?.page, params?.limit, params?.visibility]
  );
};

export const useSharedDiaries = () => {
  return useApi(() => diaryApi.getSharedDiaries());
};

export const useDiary = (id: string) => {
  return useApi(
    () => diaryApi.getDiary(id),
    [id]
  );
};

// ==================== 消息中心 Hooks ====================

export const useMessages = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  read?: boolean;
}) => {
  return useApi(
    () => messageApi.getMessages(params),
    [params?.page, params?.limit, params?.type, params?.read]
  );
};

// ==================== 操作 Hooks ====================

export const useCreateUser = () => {
  const [loading, setLoading] = useState(false);

  const createUser = async (userData: {
    username: string;
    nickname: string;
    phone: string;
    role: string;
  }) => {
    setLoading(true);
    try {
      const response = await userApi.createUser(userData);
      if (response.success) {
        message.success('用户创建成功');
        return response.data;
      } else {
        message.error(response.message || '创建失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('创建用户失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createUser, loading };
};

export const useUpdateUser = () => {
  const [loading, setLoading] = useState(false);

  const updateUser = async (id: string, userData: any) => {
    setLoading(true);
    try {
      const response = await userApi.updateUser(id, userData);
      if (response.success) {
        message.success('用户更新成功');
        return response.data;
      } else {
        message.error(response.message || '更新失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('更新用户失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateUser, loading };
};

export const useDeleteUser = () => {
  const [loading, setLoading] = useState(false);

  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      const response = await userApi.deleteUser(id);
      if (response.success) {
        message.success('用户删除成功');
        return response.data;
      } else {
        message.error(response.message || '删除失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('删除用户失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { deleteUser, loading };
};

export const useCreateProject = () => {
  const [loading, setLoading] = useState(false);

  const createProject = async (projectData: {
    name: string;
    description: string;
  }) => {
    setLoading(true);
    try {
      const response = await projectApi.createProject(projectData);
      if (response.success) {
        message.success('项目创建成功');
        return response.data;
      } else {
        message.error(response.message || '创建失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('创建项目失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createProject, loading };
};

export const useCreateTask = () => {
  const [loading, setLoading] = useState(false);

  const createTask = async (taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    assigned_to?: string;
    project_id?: string;
    parent_task_id?: string;
  }) => {
    setLoading(true);
    try {
      const response = await taskApi.createTask(taskData);
      if (response.success) {
        message.success('任务创建成功');
        return response.data;
      } else {
        message.error(response.message || '创建失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('创建任务失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createTask, loading };
};

export const useCreateDiary = () => {
  const [loading, setLoading] = useState(false);

  const createDiary = async (diaryData: {
    title: string;
    content: string;
    visibility: 'public' | 'project' | 'private' | 'members';
    shared_with?: string[];
    project_id?: string;
  }) => {
    setLoading(true);
    try {
      const response = await diaryApi.createDiary(diaryData);
      if (response.success) {
        message.success('日记创建成功');
        return response.data;
      } else {
        message.error(response.message || '创建失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('创建日记失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createDiary, loading };
};

// ==================== 文件上传 Hooks ====================

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, type: 'avatar' | 'document' | 'image' = 'image') => {
    setUploading(true);
    try {
      const response = await uploadApi.uploadFile(file, type);
      if (response.success) {
        message.success('文件上传成功');
        return response.data;
      } else {
        message.error(response.message || '上传失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('文件上传失败');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    return uploadFile(file, 'avatar');
  };

  const uploadDocument = async (file: File) => {
    return uploadFile(file, 'document');
  };

  return { 
    uploadFile, 
    uploadAvatar, 
    uploadDocument, 
    uploading 
  };
};

// ==================== 用户资料更新 Hook ====================

// 用户资料更新 Hook
export const useUpdateProfile = () => {
  const [loading, setLoading] = useState(false);

  const updateProfile = async (updateData: {
    name: string;
    phone: string;
    email: string;
    hire_date?: Date;
    contract_expiry?: Date;
    status: string;
    role?: string;
  }) => {
    setLoading(true);
    try {
      const response = await authApi.updateProfile(updateData);
      if (response.success) {
        message.success('资料提交成功，请等待管理员审核');
        return response;
      } else {
        message.error(response.message || '更新失败');
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error("更新用户资料失败:", error);
      
      // 直接使用错误消息，不依赖response结构
      const errorMessage = error.message || "更新失败，请重试";
      console.log("显示错误消息:", errorMessage);
      
      // 直接抛出错误，让组件处理
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading };
};

// ==================== 检查首个用户 Hook ====================

// 检查首个用户 Hook
export const useCheckFirstUser = () => {
  const [loading, setLoading] = useState(false);

  const checkFirstUser = async () => {
    setLoading(true);
    try {
      const response = await authApi.checkFirstUser();
      return response;
    } catch (error) {
      console.error("检查首个用户失败:", error);
      message.error("检查失败，请重试");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { checkFirstUser, loading };
};

// ==================== 检查用户状态 Hook ====================

// 检查用户状态 Hook（用于 PendingReview 组件）
export const useCheckUserStatus = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      const response = await authApi.getCurrentUser();
      if (response.success) {
        const user = response.data;
        setUserInfo(user);
        
        // 如果状态变为"已通过"，显示成功提示
        if (user.status === "已通过") {
          message.success("审核通过！欢迎使用系统");
        }
        
        return user;
      } else {
        throw new Error(response.message || '获取用户信息失败');
      }
    } catch (error: any) {
      console.error("检查用户状态失败:", error);
      message.error("检查状态失败");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    checkUserStatus, 
    loading, 
    userInfo, 
    setUserInfo 
  };
}; 

// ==================== 文档管理 Hooks ====================

export const useDocuments = (params?: DocumentQueryParams) => {
  const stableParams = useRef(params);
  stableParams.current = params;
  
  return useApi(
    () => documentApi.getDocuments(stableParams.current),
    [params?.skip, params?.limit, params?.visibility, params?.order_by]
  );
};

export const useDocument = (id: number) => {
  return useApi(
    () => documentApi.getDocument(id),
    [id]
  );
};

export const useCreateDocument = () => {
  const [loading, setLoading] = useState(false);

  const createDocument = async (documentData: CreateDocumentData) => {
    setLoading(true);
    try {
      const response = await documentApi.createDocument(documentData);
      if (response.success) {
        message.success('文档创建成功');
        return response.data;
      } else {
        message.error(response.message || '创建失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('创建文档失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createDocument, loading };
};

export const useUpdateDocument = () => {
  const [loading, setLoading] = useState(false);

  const updateDocument = async (id: number, documentData: UpdateDocumentData) => {
    setLoading(true);
    try {
      const response = await documentApi.updateDocument(id, documentData);
      if (response.success) {
        message.success('文档更新成功');
        return response.data;
      } else {
        message.error(response.message || '更新失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('更新文档失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateDocument, loading };
};

export const useDeleteDocument = () => {
  const [loading, setLoading] = useState(false);

  const deleteDocument = async (id: number) => {
    setLoading(true);
    try {
      const response = await documentApi.deleteDocument(id);
      if (response.success) {
        message.success('文档删除成功');
        return response.data;
      } else {
        message.error(response.message || '删除失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('删除文档失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { deleteDocument, loading };
};

// ==================== 文档评论 Hooks ====================

export const useDocumentComments = (documentId: number) => {
  return useApi(
    () => documentCommentApi.listByDocument(documentId),
    [documentId]
  );
};

export const useAddComment = () => {
  const [loading, setLoading] = useState(false);

  const addComment = async (commentData: AddCommentData) => {
    setLoading(true);
    try {
      const response = await documentCommentApi.addComment(commentData);
      if (response.success) {
        message.success('评论添加成功');
        return response.data;
      } else {
        message.error(response.message || '添加失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('添加评论失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { addComment, loading };
};

// 获取单个文档评论的 hook
export const useFetchDocumentComments = () => {
  const [loading, setLoading] = useState(false);

  const fetchComments = async (documentId: number) => {
    setLoading(true);
    try {
      const response = await documentCommentApi.listByDocument(documentId);
      if (response.success) {
        return response.data || [];
      } else {
        message.error(response.message || '获取评论失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('获取评论失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { fetchComments, loading };
}; 

// ==================== 登录相关 Hooks ====================

export const useLogin = (onLoginSuccess?: (userStatus: string) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const loginRes = await wechatAuthApi.getOpenid(code);
      if (loginRes.success) {
        localStorage.setItem("isLogin", "1");
        localStorage.setItem("access_token", (loginRes.data as { access_token: string }).access_token);
        
        // 如果提供了回调函数，调用它来处理登录成功后的逻辑
        if (onLoginSuccess) {
          // 这里需要先获取用户信息来确定状态
          // 暂时不显示通用成功提示，让回调函数处理具体状态
        } else {
          message.success('登录成功！');
        }
        
        return loginRes.data;
      } else {
        const errorMsg = loginRes.message || "登录失败";
        setError(errorMsg);
        message.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "登录失败";
      setError(errorMsg);
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};

export const useQRCode = () => {
  const [qrData, setQrData] = useState<{ url: string; key: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wechatAuthApi.generate();
      if (res.success) {
        const data = res.data as { url: string; key: string };
        setQrData({ url: data.url, key: data.key });
        return data;
      } else {
        const errorMsg = res.message || "获取二维码失败";
        setError(errorMsg);
        // 移除这里的 message.error，让调用方统一处理
        throw new Error(errorMsg);
      }
    } catch (error) {
      let errorMsg = "获取二维码失败，请重试";
      if (error instanceof Error && error.message.includes('超时')) {
        errorMsg = "网络连接超时，请检查网络后重试";
      }
      setError(errorMsg);
      // 移除这里的 message.error，让调用方统一处理
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshQRCode = async () => {
    setQrData(null);
    setError(null);
    try {
      await fetchQRCode();
      // 移除这里的 message.success，让调用方统一处理
      return true;
    } catch (error) {
      // 错误提示已在 fetchQRCode 中处理
      throw error;
    }
  };

  return { 
    qrData, 
    loading, 
    error, 
    fetchQRCode, 
    refreshQRCode,
    setQrData 
  };
};

export const useQRCodePolling = (qrData: { url: string; key: string } | null, onScanSuccess?: (code: string) => void) => {
  const [polling, setPolling] = useState(false);
  const [scanStatus, setScanStatus] = useState<'pending' | 'scanned' | 'success' | 'expired'>('pending');
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 使用 ref 来存储定时器，确保能够正确清理
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    if (!qrData?.key) return;
    
    // 先清理之前的轮询
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setPolling(true);
    setError(null);
    
    intervalRef.current = setInterval(async () => {
      try {
        const res = await wechatAuthApi.getStatus(qrData.key);
        const status = (res.data as { status: string }).status;
        
        if (status === "scanned") {
          setScanStatus('scanned');
        } else if (status === "success") {
          setScanStatus('success');
          setPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          const code = (res.data as { code: string }).code;
          // 如果提供了回调函数，调用它
          if (onScanSuccess) {
            onScanSuccess(code);
          }
          return { status: 'success', code };
        } else if (status === "expired") {
          setScanStatus('expired');
          setPolling(false);
          setIsExpired(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return { status: 'expired' };
        }
      } catch (error) {
        console.error("轮询扫码状态失败:", error);
        if (error instanceof Error && error.message.includes('404')) {
          setPolling(false);
          setIsExpired(true);
          setScanStatus('expired');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return { status: 'expired' };
        }
        const errorMsg = error instanceof Error ? error.message : '轮询失败';
        setError(errorMsg);
        // 移除这里的 message.error，让调用方统一处理
      }
    }, 2000);
    
    // 60秒超时
    timeoutRef.current = setTimeout(() => {
      setPolling(false);
      setIsExpired(true);
      setScanStatus('expired');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const errorMsg = "二维码已过期，请刷新重试";
      setError(errorMsg);
      // 移除这里的 message.error，让调用方统一处理
    }, 60000);
    
    return () => {
      setPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [qrData?.key, onScanSuccess]);

  const resetStatus = useCallback(() => {
    setPolling(false);
    setScanStatus('pending');
    setIsExpired(false);
    setError(null);
    // 清理定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    polling,
    scanStatus,
    isExpired,
    error,
    startPolling,
    resetStatus,
    setScanStatus,
    setPolling,
    setIsExpired
  };
};

export const useUserStatus = (onUserStatusSuccess?: (userStatus: string) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await authApi.getCurrentUser();
      if (userRes.success) {
        localStorage.setItem("userInfo", JSON.stringify(userRes.data));
        
        // 如果提供了回调函数，调用它来处理用户状态
        if (onUserStatusSuccess) {
          onUserStatusSuccess(userRes.data.status);
        }
        
        return userRes.data;
      } else {
        const errorMsg = userRes.message || "获取用户信息失败";
        setError(errorMsg);
        message.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "获取用户信息失败";
      setError(errorMsg);
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { getCurrentUser, loading, error };
};

// 统一的登录流程处理 hook
export const useLoginFlow = (
  onNavigate?: (path: string, redirectPath?: string) => void,
  onRejected?: () => void
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = (userStatus: string, redirectPath?: string) => {
    console.log("handleLoginSuccess 被调用，用户状态:", userStatus);
    
    if (userStatus === "未审核") {
      message.success("登录成功！请完善个人资料");
      onNavigate?.("/complete-profile");
    } else if (userStatus === "待审核") {
      message.success("登录成功！请等待审核");
      onNavigate?.("/pending-review");
    } else if (userStatus === "已通过") {
      message.success("登录成功！");
      onNavigate?.(redirectPath || "/");
    } else if (userStatus === "已拒绝") {
      console.log("=======已拒绝========");
      alert("您的账户已被拒绝，请联系管理员");
      // 调用回调函数处理已拒绝状态
      onRejected?.();
    } else {
      console.log("未知的用户状态:", userStatus);
      message.error("账户状态异常，请联系管理员");
      onNavigate?.("/login");
    }
  };

  const executeLoginFlow = async (code: string, redirectPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      // 登录获取 token
      const loginRes = await wechatAuthApi.getOpenid(code);
      if (loginRes.success) {
        localStorage.setItem("isLogin", "1");
        localStorage.setItem("access_token", (loginRes.data as { access_token: string }).access_token);
        
        // 获取用户信息
        const userRes = await authApi.getCurrentUser();
        if (userRes.success) {
          localStorage.setItem("userInfo", JSON.stringify(userRes.data));
          console.log("获取用户信息成功:", userRes.data);
          handleLoginSuccess(userRes.data.status, redirectPath);
          return userRes.data;
        } else {
          throw new Error(userRes.message || "获取用户信息失败");
        }
      } else {
        throw new Error(loginRes.message || "登录失败");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "登录失败，请重试";
      setError(errorMsg);
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { executeLoginFlow, loading, error };
}; 