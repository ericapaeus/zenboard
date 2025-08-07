export default function ProductManage() {
  return (
    <main className="pt-20 pb-10">
      <h1 className="text-2xl font-bold mb-4">产品管理</h1>
      <p>这里是产品管理页面，数据可写死。</p>
      <ul className="mt-4 list-disc pl-6">
        <li>产品A（已上架）</li>
        <li>产品B（下架）</li>
        <li>产品C（缺货）</li>
      </ul>
    </main>
  );
}
