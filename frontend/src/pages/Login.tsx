import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Spin, message } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import { wechatAuthApi, authApi } from "@/services/api";
import { QRCode } from "antd";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<{ url: string; key: string } | null>(null);
  const [polling, setPolling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [scanStatus, setScanStatus] = useState<'pending' | 'scanned' | 'success' | 'expired'>('pending');
  const hasInitialized = useRef(false);

  // 获取二维码和key
  const fetchQRCode = async () => {
    setIsLoading(true);
    try {
      const res = await wechatAuthApi.generate();
      if (res.success) {
      console.log("获取二维码成功:", res.data)
        setQrData({ url: (res.data as any).url, key: (res.data as any).key });
        console.log("设置的key:", (res.data as any).key);
      } else {
        message.error(res.message || "获取二维码失败");
      }
    } catch (error) {
      console.error("获取二维码失败:", error);
      if (error instanceof Error && error.message.includes('超时')) {
        message.error("网络连接超时，请检查网络后重试");
      } else {
        message.error("获取二维码失败，请重试");
      }
    }
    setIsLoading(false);
  };

  // 刷新二维码
  const refreshQRCode = async () => {
    if (isRefreshing) return; // 防抖
    
    setIsRefreshing(true);
    setPolling(false); // 停止当前轮询
    setQrData(null); // 清空旧的二维码数据
    setIsExpired(false); // 重置过期状态
    setScanStatus('pending'); // 重置扫码状态
    hasInitialized.current = false; // 重置初始化标志
    
    try {
      await fetchQRCode();
      message.success("二维码已刷新");
    } catch (error) {
      console.error("刷新二维码失败:", error);
      message.error("刷新失败，请重试");
    } finally {
      setIsRefreshing(false);
    }
  };

  // 轮询扫码状态
  useEffect(() => {
    if (!qrData?.key) return;
    setPolling(true);
    const timer = setInterval(async () => {
      try {
        console.log("轮询使用的key:", qrData.key);
        const res = await wechatAuthApi.getStatus(qrData.key);
        const status = (res.data as any).status;
        
        // 根据状态设置扫码状态
        if (status === "scanned") {
          setScanStatus('scanned');
        } else if (status === "success") {
          setScanStatus('success');
          // 扫码成功，立即停止轮询
          setPolling(false);
          clearInterval(timer);
          
          // 获取 openid 并登录
          const code = (res.data as any).code;
          console.log("扫码成功，获取到 code:", code);
          
          const loginRes = await wechatAuthApi.getOpenid(code);
          if (loginRes.success) {
            localStorage.setItem("isLogin", "1");
            localStorage.setItem("access_token", (loginRes.data as any).access_token);
            
            // 获取用户信息
            try {
              const userRes = await authApi.getCurrentUser();
              if (userRes.success) {
                localStorage.setItem("userInfo", JSON.stringify(userRes.data));
            message.success("登录成功！");
                navigate("/");
              } else {
                message.error("获取用户信息失败");
              }
            } catch (userError) {
              console.error("获取用户信息失败:", userError);
              message.error("获取用户信息失败，但登录成功");
            navigate("/");
            }
          } else {
            message.error(loginRes.message || "登录失败");
          }
        } else if (status === "expired") {
          setScanStatus('expired');
          setPolling(false);
          setIsExpired(true);
          clearInterval(timer);
        }
      } catch (error) {
        console.error("轮询扫码状态失败:", error);
        // 如果是超时错误，可以考虑停止轮询
        if (error instanceof Error && error.message.includes('超时')) {
          console.warn("轮询超时，可能需要刷新二维码");
        }
        // 如果是404错误（二维码过期），设置过期状态
        if (error instanceof Error && error.message.includes('404')) {
          console.warn("二维码已过期");
          setPolling(false);
          setIsExpired(true);
          setScanStatus('expired');
          clearInterval(timer);
        }
      }
    }, 2000);
    
    // 60秒超时
    const timeoutId = setTimeout(() => {
      setPolling(false);
      setIsExpired(true);
      setScanStatus('expired');
      clearInterval(timer);
      message.error("二维码已过期，请刷新重试");
    }, 60000);
    
    return () => {
      setPolling(false);
      clearInterval(timer);
      clearTimeout(timeoutId);
    };
  }, [qrData?.key, navigate]);

  // 点击二维码直接登录（开发测试用）
  const handleQRCodeClick = () => {
    if (qrData && !isExpired) {
      console.log("开发模式：点击二维码直接登录");
      localStorage.setItem("isLogin", "1");
      localStorage.setItem("access_token", "dev_token_" + Date.now());
      message.success("开发模式：直接登录成功！");
      navigate("/");
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchQRCode();
    }
  }, []);

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
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrcodeOutlined className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ZenBoard
          </h1>
          <p className="text-gray-500 mt-2">团队协作平台</p>
        </div>

        {/* 扫码登录 */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-100">
              {qrData && typeof qrData.url === 'string' && qrData.url.length > 0 ? (
                <div 
                  onClick={handleQRCodeClick}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  title="开发模式：点击直接登录"
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
            <p className="text-blue-500 text-xs">💡 开发模式：点击二维码可直接登录</p>
            <button
              onClick={refreshQRCode}
              disabled={isLoading || polling || isRefreshing}
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
        © 2025 万店盈利公司 版权所有
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