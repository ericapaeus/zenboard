export default function OrderManage() {
  return (
    <main className="pt-20 pb-10">
      <h1 className="text-2xl font-bold mb-4">订单管理</h1>
      <p>这里是订单管理页面，数据可写死。</p>
      <ul className="mt-4 list-disc pl-6">
        <li>订单#1001（已完成）</li>
        <li>订单#1002（待发货）</li>
        <li>订单#1003（已取消）</li>
      </ul>
    </main>
  );
}
