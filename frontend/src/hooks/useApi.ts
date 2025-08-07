import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { authApi, userApi, teamApi, projectApi, taskApi, diaryApi, messageApi } from '@/services/api';
import type { ApiResponse } from '@/utils/api';

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

// 通用 API Hook
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await apiCall();
      
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
        message.error(response.message || '请求失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      message.error(errorMessage);
    }
  }, [apiCall]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch,
    setData,
  };
}

// 认证相关 Hooks
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (qrCode: string) => {
    setLoading(true);
    try {
      const response = await authApi.login(qrCode);
      if (response.success) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        localStorage.setItem('isLogin', '1');
        setUser(response.data.user);
        message.success('登录成功！');
        return response.data;
      } else {
        message.error(response.message || '登录失败');
        throw new Error(response.message);
      }
    } catch (error) {
      message.error('登录失败，请重试');
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

// 用户管理 Hooks
export const useUsers = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
}) => {
  return useApi(
    () => userApi.getUsers(params),
    [params?.page, params?.limit, params?.status, params?.role]
  );
};

export const useUser = (id: string) => {
  return useApi(
    () => userApi.getUser(id),
    [id]
  );
};

// 团队管理 Hooks
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

// 项目管理 Hooks
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

// 任务管理 Hooks
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

// 日记系统 Hooks
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

// 消息中心 Hooks
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

// 操作 Hooks（用于创建、更新、删除操作）
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