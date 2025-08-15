import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Spin, message } from "antd";
import { QRCode } from "antd";
import { appConfig } from "@/config/app";
import { useQRCode, useQRCodePolling, useLoginFlow } from "@/hooks/useApi";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitialized = useRef(false);

  // 获取用户原来想访问的页面
  const getRedirectPath = () => {
    const from = location.state?.from?.pathname;
    return from && from !== '/login' ? from : '/';
  };

  // 处理登录成功后的跳转
  const handleLoginSuccess = (path: string, redirectPath?: string) => {
    console.log("handleLoginSuccess 被调用，跳转路径:", path, "重定向路径:", redirectPath);
    navigate(path);
  };

  // 处理扫码成功
  const handleScanSuccess = async (code: string) => {
    try {
      // 使用统一的登录流程 hook，传递重定向路径
      const redirectPath = getRedirectPath();
      await executeLoginFlow(code, redirectPath);
    } catch (error) {
      console.error("登录流程失败:", error);
      // 错误提示已在 hook 中处理
      resetStatus();
    }
  };

  // 处理已拒绝状态
  const handleRejected = () => {
    // 重置扫码状态，避免显示"正在登录中..."
    resetStatus();
    // 重新获取二维码，让用户可以重新扫码
    fetchQRCode();
  };

  // 使用自定义 hooks
  const { 
    qrData, 
    loading: qrLoading, 
    error: qrError, 
    fetchQRCode
  } = useQRCode();
  
  const { 
    scanStatus, 
    isExpired, 
    error: pollingError, 
    startPolling, 
    resetStatus,
    setIsExpired,
    setPolling
  } = useQRCodePolling(qrData, handleScanSuccess);
  
  // 使用统一的登录流程 hook
  const { executeLoginFlow, loading: loginLoading, error: loginError } = useLoginFlow(handleLoginSuccess, handleRejected);

  // 轮询扫码状态
  useEffect(() => {
    if (!qrData?.key) return;
    
    const cleanup = startPolling();
    
    // 5秒超时（测试用）
    const timeoutId = setTimeout(() => {
      // 设置过期状态，这样遮层就能正确显示
      setIsExpired(true);
      // 确保轮询状态被重置，这样刷新按钮就不会被禁用
      setPolling(false);
      // 立即停止轮询，防止继续调用接口
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      message.error("二维码已过期，请刷新重试");
    }, 60000);
    
    return () => {
      // 组件卸载或依赖变化时清理
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      clearTimeout(timeoutId);
    };
  }, [qrData?.key, startPolling, setIsExpired, setPolling]);

  // 监听过期状态，确保过期后停止轮询
  useEffect(() => {
    if (isExpired && qrData?.key) {
      // 二维码过期后，强制停止轮询
      const cleanup = startPolling();
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
      setPolling(false);
    }
  }, [isExpired, qrData?.key, startPolling, setPolling]);

  // 监听扫码状态变化
  useEffect(() => {
    if (scanStatus === 'success' && qrData?.key) {
      // 这里需要从轮询结果中获取 code，我们需要修改 useQRCodePolling hook
      // 暂时保持原有的轮询逻辑
    }
  }, [scanStatus, qrData?.key]);

  // 初始化获取二维码
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchQRCode();
    }
  }, [fetchQRCode]);

  // 错误处理
  useEffect(() => {
    if (qrError) {
      message.error(qrError);
    }
    if (pollingError) {
      message.error(pollingError);
    }
    if (loginError) {
      // 登录错误提示已在 hook 中处理，这里不需要重复显示
    }
  }, [qrError, pollingError, loginError]);

  // 计算加载状态
  const isLoading = qrLoading || loginLoading;

  // 处理刷新二维码
  const handleRefreshQRCode = async () => {
    // 只有在过期状态下才允许刷新
    if (!isExpired) {
      message.warning("二维码尚未过期，无需刷新");
      return;
    }
    
    try {
      // 重置所有状态
      resetStatus();
      // 获取新的二维码
      await fetchQRCode();
      message.success("二维码已刷新");
    } catch {
      message.error("刷新二维码失败，请重试");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {appConfig.app.fullName}
          </h1>
          <p className="text-gray-500 mt-2">{appConfig.app.englishName}</p>
        </div>

        {/* 扫码登录 */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-100">
              {qrData && typeof qrData.url === 'string' && qrData.url.length > 0 ? (
                <div 
                  onClick={handleRefreshQRCode}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  title="点击刷新二维码"
                >
                  <QRCode value={qrData.url} size={192} />
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                  <Spin size="large" />
                </div>
              )}
            </div>
            {/* 只在 isLoading 时遮住二维码，polling 时不遮住 */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <Spin size="large" />
              </div>
            )}
            {/* 扫码状态遮罩 */}
            {scanStatus === 'scanned' && (
              <div className="absolute inset-0 bg-blue-500/60 rounded-xl flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-lg font-semibold mb-2">扫码中</div>
                  <div className="text-sm opacity-90">请确认登录</div>
                </div>
              </div>
            )}
            {/* 扫码成功遮罩 */}
            {scanStatus === 'success' && (
              <div className="absolute inset-0 bg-green-500/60 rounded-xl flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-lg font-semibold mb-2">扫码成功</div>
                  <div className="text-sm opacity-90">正在登录中...</div>
                </div>
              </div>
            )}
            {/* 二维码过期遮层 */}
            {isExpired && (
              <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-lg font-semibold mb-2">二维码已过期</div>
                  <div className="text-sm opacity-90">请点击下方按钮刷新</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-gray-600 text-sm">使用手机扫描二维码登录</p>
            <button
              onClick={handleRefreshQRCode}
              disabled={isLoading || !isExpired}
              className="text-blue-600 text-sm hover:text-blue-700 disabled:opacity-50"
            >
              刷新二维码
            </button>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">
            登录即表示同意
            <a href="#" className="text-blue-600 hover:text-blue-700">服务条款</a>
            和
            <a href="#" className="text-blue-600 hover:text-blue-700">隐私政策</a>
          </p>
        </div>
      </div>

      {/* 页脚 */}
      <div className="relative z-10 mt-8 text-gray-400 text-sm select-none">
        © {appConfig.company.copyrightYear} {appConfig.company.name} 版权所有
      </div>

      {/* 添加动画样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `
      }} />
    </div>
  );
} 