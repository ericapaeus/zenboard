import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import Task from './Task'; // Import the Task component

const { Title } = Typography;

export default function Dashboard() {
  const markdownContent = `
# 通知和提醒

## 2024年8月11日
*   **系统维护通知：** ZenBoard 系统将于今晚 22:00 - 23:00 进行例行维护，期间部分服务可能受影响。请提前保存您的工作。
*   **新功能上线：** 任务模块新增“子任务”功能，现在您可以在任务详情中添加和管理子任务了。

## 2024年8月8日
*   **项目进展提醒：** “ZenBoard 前端优化”项目已完成 80%，请相关负责人及时更新进度。
*   **待处理任务：** 您有 3 项待处理任务已逾期，请尽快处理。

## 2024年8月1日
*   **欢迎使用 ZenBoard！** 这是您的工作台，您可以在这里查看待办任务和重要通知。
`;

  return (
    <div className="p-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* 任务列表区域 */}
          <Task displayMode="pendingOnly" />
        </Col>
        <Col xs={24} lg={8}>
          {/* 通知和提醒区域 */}
          <Card title="通知和提醒" className="shadow-sm h-full">
            <div 
              className="markdown-content" 
              dangerouslySetInnerHTML={{ __html: markdownContent }} 
              style={{ whiteSpace: 'pre-wrap' }} // Preserve line breaks
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
