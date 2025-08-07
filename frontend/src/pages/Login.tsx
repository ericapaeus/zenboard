import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Spin, message } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // 模拟二维码刷新
  const [qrCodeKey, setQrCodeKey] = useState(Date.now());

  const refreshQRCode = () => {
    setQrCodeKey(Date.now());
    message.success('二维码已刷新');
  };

  const handleLogin = async () => {
    setIsLoading(true);
    
    // 模拟登录请求
    setTimeout(() => {
      localStorage.setItem("isLogin", "1");
      localStorage.setItem("userInfo", JSON.stringify({
        username: '扫码用户',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        role: 'admin'
      }));
      message.success('登录成功！');
      navigate("/");
    }, 1500);
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
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=login-${qrCodeKey}`}
                alt="登录二维码"
                className="w-48 h-48 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={handleLogin}
                title="点击二维码进入系统"
              />
            </div>
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <Spin size="large" />
              </div>
            )}
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-gray-600 text-sm">使用手机扫描二维码登录</p>
            <button
              onClick={refreshQRCode}
              disabled={isLoading}
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