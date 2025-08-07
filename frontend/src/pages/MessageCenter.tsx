export default function MessageCenter() {
  return (
    <main className="pt-20 pb-10">
      <h1 className="text-2xl font-bold mb-4">消息中心</h1>
      <p>这里是消息中心页面，数据可写死。</p>
      <ul className="mt-4 list-disc pl-6">
        <li>系统通知：欢迎使用Zenith！</li>
        <li>审批提醒：有新用户待审批</li>
        <li>合同到期提醒：用户B合同即将到期</li>
      </ul>
    </main>
  );
}
