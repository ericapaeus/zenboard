import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import { authApi } from '@/services/api';

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowStatuses?: string[]; // 允许访问的状态列表
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
	children, 
	allowStatuses = ["已通过"]
}) => {
	const location = useLocation();
	const [isChecking, setIsChecking] = useState(true);
	const [isAuthorized, setIsAuthorized] = useState(false);
	
	useEffect(() => {
		const checkAuth = async () => {
			try {
				// 检查是否有登录token
				const token = localStorage.getItem('access_token');
				if (!token) {
					setIsAuthorized(false);
					setIsChecking(false);
					return;
				}

				// 获取当前用户信息
				const response = await authApi.getCurrentUser();
				if (response.success) {
					const user = response.data;
					
					// 检查用户状态是否在允许列表中
					if (allowStatuses.includes(user.status)) {
						setIsAuthorized(true);
					} else {
						// 如果状态不匹配，根据状态跳转到相应页面
						if (user.status === "未审核") {
							// 跳转到完善资料页面
							window.location.href = '/complete-profile';
							return;
						} else if (user.status === "待审核") {
							// 跳转到等待审核页面
							window.location.href = '/pending-review';
							return;
						} else if (user.status === "已拒绝") {
							// 跳转到登录页面
							window.location.href = '/login';
							return;
						}
						setIsAuthorized(false);
					}
				} else {
					setIsAuthorized(false);
				}
			} catch (error) {
				console.error('权限检查失败:', error);
				setIsAuthorized(false);
			} finally {
				setIsChecking(false);
			}
		};

		checkAuth();
	}, [allowStatuses, location.pathname]);
	
	// 如果正在检查，显示加载动画
	if (isChecking) {
		return <LoadingScreen tip="正在验证权限..." size="default" />;
	}
	
	// 如果未授权，重定向到登录页面
	if (!isAuthorized) {
		// 保存当前路径，登录后可以跳转回来
		return <Navigate to="/login" state={{ from: location }} replace />;
	}
	
	// 如果已授权，渲染子组件
	return <>{children}</>;
};

export default ProtectedRoute; 