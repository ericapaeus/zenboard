import { Card, Row, Col, Statistic, Button, Select, Space, Progress, Tag, Divider } from 'antd';
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  WalletOutlined, 
  PieChartOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  PlusOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';

export default function Dashboard() {
  return (
    <>
      {/* 页面标题区域 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来，管理员！这里是你的系统概览。</p>
      </div>

      {/* 操作按钮和时间选择区域 */}
      <div className="bg-[#f7f8fa] rounded-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              新建项目
            </Button>
            <Button icon={<DownloadOutlined />}>
              导出数据
            </Button>
            <Button icon={<FilterOutlined />}>
              筛选
            </Button>
          </Space>
          <Space>
            <span className="text-gray-500 text-sm">时间范围:</span>
            <Select defaultValue="month" style={{ width: 120 }}>
              <Select.Option value="today">今日</Select.Option>
              <Select.Option value="week">本周</Select.Option>
              <Select.Option value="month">本月</Select.Option>
              <Select.Option value="quarter">本季度</Select.Option>
              <Select.Option value="year">本年</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </Space>
        </div>
      </div>

      {/* 数据统计卡片区域 */}
      <div className="bg-[#f7f8fa] rounded-lg p-6 mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
              <Statistic
                title="总用户"
                value={12854}
                prefix={<UserOutlined className="text-blue-500" />}
                suffix={
                  <span className="text-green-600 text-sm flex items-center">
                    <ArrowUpOutlined className="mr-1" />
                    12.5% vs 上月
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
              <Statistic
                title="总订单"
                value={8452}
                prefix={<ShoppingCartOutlined className="text-blue-400" />}
                suffix={
                  <span className="text-green-600 text-sm flex items-center">
                    <ArrowUpOutlined className="mr-1" />
                    8.2% vs 上月
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
              <Statistic
                title="总收入"
                value={128540}
                prefix={<WalletOutlined className="text-green-500" />}
                suffix={
                  <span className="text-red-500 text-sm flex items-center">
                    <ArrowDownOutlined className="mr-1" />
                    2.1% vs 上月
                  </span>
                }
                formatter={(value) => `¥${value}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow border-0">
              <Statistic
                title="活跃度"
                value={78.5}
                prefix={<PieChartOutlined className="text-yellow-500" />}
                suffix={
                  <span className="text-green-600 text-sm flex items-center">
                    <ArrowUpOutlined className="mr-1" />
                    5.3% vs 上月
                  </span>
                }
                formatter={(value) => `${value}%`}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 分层数据展示区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div className="bg-[#f7f8fa] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">业务概览</h3>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">转化率</span>
                    <span className="font-semibold text-red-600">23.4%</span>
                  </div>
                  <Progress percent={23.4} strokeColor="#ff4d4f" />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">客单价</span>
                    <span className="font-semibold text-red-600">¥156.8</span>
                  </div>
                  <Progress percent={65} strokeColor="#ff4d4f" />
                </div>
              </Col>
              <Col span={12}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">复购率</span>
                    <span className="font-semibold text-red-600">67.2%</span>
                  </div>
                  <Progress percent={67.2} strokeColor="#ff4d4f" />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">新增用户</span>
                    <span className="font-semibold text-orange-600">1,234</span>
                  </div>
                  <Progress percent={45} strokeColor="#fa8c16" />
                </div>
              </Col>
            </Row>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="bg-[#f7f8fa] rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-red-600 font-semibold text-lg">数据分层分析</span>
              <Tag color="red" className="ml-2">实时</Tag>
            </div>
            <div className="space-y-4">
              {/* 核心指标 */}
              <div className="border-l-4 border-red-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">核心指标</h4>
                  <Tag color="red">实时</Tag>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">转化率</span>
                    <span className="font-semibold text-red-600">23.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">客单价</span>
                    <span className="font-semibold text-red-600">¥156.8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">复购率</span>
                    <span className="font-semibold text-red-600">67.2%</span>
                  </div>
                </div>
              </div>

              <Divider />

              {/* 业务指标 */}
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">业务指标</h4>
                  <Tag color="orange">日更</Tag>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">新增用户</span>
                    <span className="font-semibold text-orange-600">1,234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">活跃用户</span>
                    <span className="font-semibold text-orange-600">8,567</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">流失用户</span>
                    <span className="font-semibold text-orange-600">234</span>
                  </div>
                </div>
              </div>

              <Divider />

              {/* 财务指标 */}
              <div className="border-l-4 border-yellow-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">财务指标</h4>
                  <Tag color="gold">周更</Tag>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">毛利率</span>
                    <span className="font-semibold text-yellow-600">42.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">运营成本</span>
                    <span className="font-semibold text-yellow-600">¥45,678</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">净利润</span>
                    <span className="font-semibold text-yellow-600">¥82,862</span>
                  </div>
                </div>
              </div>

              <Divider />

              {/* 风险指标 */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">风险指标</h4>
                  <Tag color="green">月更</Tag>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">坏账率</span>
                    <span className="font-semibold text-green-600">0.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">库存周转</span>
                    <span className="font-semibold text-green-600">12.5天</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">客户满意度</span>
                    <span className="font-semibold text-green-600">4.6/5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
}