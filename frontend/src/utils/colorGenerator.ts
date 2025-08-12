// 项目颜色自动生成器
// 提供多种颜色方案，确保项目有独特的视觉标识

// 预设的调色板 - 使用现代、专业的颜色
const PROJECT_COLORS = [
  '#1890ff', // 蓝色 - 科技感
  '#52c41a', // 绿色 - 成功感
  '#fa8c16', // 橙色 - 活力感
  '#722ed1', // 紫色 - 创意感
  '#eb2f96', // 粉色 - 时尚感
  '#13c2c2', // 青色 - 清新感
  '#fa541c', // 红色 - 重要感
  '#a0d911', // 青柠色 - 年轻感
  '#f5222d', // 红色 - 紧急感
  '#2f54eb', // 深蓝色 - 稳重感
  '#faad14', // 黄色 - 警告感
  '#52c41a', // 绿色 - 完成感
  '#722ed1', // 紫色 - 高端感
  '#13c2c2', // 青色 - 专业感
  '#fa8c16', // 橙色 - 温暖感
];

/**
 * 根据项目ID生成唯一的颜色
 * @param projectId 项目ID
 * @returns 十六进制颜色值
 */
export const generateProjectColor = (projectId: string | number): string => {
  // 将项目ID转换为数字索引
  const numericId = typeof projectId === 'string' ? parseInt(projectId.replace(/\D/g, '')) : projectId;
  
  // 使用模运算确保颜色在预设范围内循环
  const colorIndex = Math.abs(numericId) % PROJECT_COLORS.length;
  
  return PROJECT_COLORS[colorIndex];
};

/**
 * 根据项目名称生成颜色（更随机）
 * @param projectName 项目名称
 * @returns 十六进制颜色值
 */
export const generateColorByName = (projectName: string): string => {
  // 将项目名称转换为数字
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    const char = projectName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 使用哈希值选择颜色
  const colorIndex = Math.abs(hash) % PROJECT_COLORS.length;
  return PROJECT_COLORS[colorIndex];
};

/**
 * 获取所有可用的项目颜色
 * @returns 颜色数组
 */
export const getAvailableColors = (): string[] => {
  return [...PROJECT_COLORS];
};

/**
 * 生成渐变色（用于特殊项目）
 * @param baseColor 基础颜色
 * @returns 渐变CSS值
 */
export const generateGradient = (baseColor: string): string => {
  // 创建稍微深一点的版本
  const darkerColor = adjustColorBrightness(baseColor, -20);
  return `linear-gradient(135deg, ${baseColor} 0%, ${darkerColor} 100%)`;
};

/**
 * 调整颜色亮度
 * @param color 原始颜色
 * @param amount 调整量（正数变亮，负数变暗）
 * @returns 调整后的颜色
 */
const adjustColorBrightness = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * 检查颜色是否足够对比度（用于文字可读性）
 * @param backgroundColor 背景颜色
 * @param textColor 文字颜色
 * @returns 是否满足对比度要求
 */
export const hasGoodContrast = (backgroundColor: string, textColor: string = '#ffffff'): boolean => {
  // 简单的对比度检查
  const bg = backgroundColor.replace('#', '');
  const text = textColor.replace('#', '');
  
  const bgR = parseInt(bg.substr(0, 2), 16);
  const bgG = parseInt(bg.substr(2, 2), 16);
  const bgB = parseInt(bg.substr(4, 2), 16);
  
  const textR = parseInt(text.substr(0, 2), 16);
  const textG = parseInt(text.substr(2, 2), 16);
  const textB = parseInt(text.substr(4, 2), 16);
  
  // 计算亮度差异
  const bgBrightness = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;
  const textBrightness = (textR * 299 + textG * 587 + textB * 114) / 1000;
  
  return Math.abs(bgBrightness - textBrightness) > 128;
};

export default {
  generateProjectColor,
  generateColorByName,
  getAvailableColors,
  generateGradient,
  hasGoodContrast,
}; 