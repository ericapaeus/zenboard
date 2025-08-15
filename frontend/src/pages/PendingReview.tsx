import { useEffect, useCallback, useRef } from 'react';
import { Card, Result, Button, Spin, message } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCheckUserStatus, useCheckFirstUser } from '@/hooks/useApi';

export default function PendingReview() {
  const navigate = useNavigate();
  const { checkUserStatus, loading } = useCheckUserStatus();
  const { checkFirstUser, loading: checkFirstUserLoading, error: checkFirstUserError } = useCheckFirstUser();

  // 使用 useRef 来存储函数引用，避免依赖循环
  const checkUserStatusRef = useRef(checkUserStatus);
  const navigateRef = useRef(navigate);
  
  // 更新 ref 值
  checkUserStatusRef.current = checkUserStatus;
  navigateRef.current = navigate;

  // 检查用户状态
  const handleCheckUserStatus = useCallback(async () => {
    try {
      const user = await checkUserStatusRef.current();
      
      // 根据状态进行不同处理
      if (user.status === "已通过") {
        // 不显示消息，直接跳转，让 ProtectedRoute 处理
        navigateRef.current("/");
        return;
      } else if (user.status === "已拒绝") {
        message.error("审核未通过，请联系管理员");
        navigateRef.current("/complete-profile");
        return;
      }
      // 如果是"待审核"状态，继续显示等待页面
    } catch (error) {
      // 错误处理已经在 hook 中完成
      console.error("检查用户状态失败:", error);
    }
  }, []); // 空依赖数组，因为使用 ref 来访问最新值

  // 检查是否为第一个用户
  const handleCheckFirstUser = useCallback(async () => {
    try {
      const result = await checkFirstUser();
      if (result?.isFirstUser) {
        if (result.autoUpgraded) {
          // 自动升级成功
          message.success("检测到您是系统第一个用户，已自动设置为管理员！");
          // 更新本地存储的用户信息
          const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          const updatedUserInfo = {
            ...currentUserInfo,
            role: result.newRole,
            status: result.newStatus
          };
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          
          // 延迟后重新检查用户状态，应该会显示为已通过并跳转
          setTimeout(() => {
            handleCheckUserStatus();
          }, 1500);
        } else {
          // 检测到是第一个用户但自动升级失败
          message.warning("检测到您是系统第一个用户，但自动升级失败，请联系管理员");
        }
      }
    } catch (error) {
      console.error("检查第一个用户失败:", error);
    }
  }, [checkFirstUser, handleCheckUserStatus]);

  useEffect(() => {
    // 先检查是否为第一个用户
    handleCheckFirstUser();
    // 然后检查用户状态
    handleCheckUserStatus();
    // 每30秒检查一次状态
    const interval = setInterval(handleCheckUserStatus, 30000);
    return () => clearInterval(interval);
  }, [handleCheckFirstUser, handleCheckUserStatus]);

  const handleRefresh = () => {
    handleCheckUserStatus();
  };

  const handleLogout = () => {
    localStorage.removeItem("isLogin");
    localStorage.removeItem("access_token");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  if (loading || checkFirstUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">正在检查审核状态...</p>
          </div>
        </Card>
      </div>
    );
  }

  // 处理第一个用户检查错误
  if (checkFirstUserError) {
    console.error("检查第一个用户时发生错误:", checkFirstUserError);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <Result
          icon={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
          title="资料审核中"
          subTitle="您的资料已提交，正在等待管理员审核"
          extra={[
            <Button key="refresh" type="primary" onClick={handleRefresh}>
              刷新状态
            </Button>,
            <Button key="logout" onClick={handleLogout}>
              退出登录
            </Button>
          ]}
        >
          <div className="text-left space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">审核流程说明：</h3>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• 提交资料后状态变为"待审核"</li>
                <li>• 管理员将审核您的资料</li>
                <li>• 审核通过后状态变为"已通过"</li>
                <li>• 审核不通过需要重新提交资料</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">温馨提示：</h3>
              <ul className="text-yellow-700 space-y-1 text-sm">
                <li>• 页面会自动刷新检查审核状态</li>
                <li>• 您也可以手动点击"刷新状态"按钮</li>
                <li>• 审核通过后会自动跳转到系统首页</li>
                <li>• 如有疑问请联系系统管理员</li>
              </ul>
            </div>
          </div>
        </Result>
      </Card>
    </div>
  );
} 