# Hooks 循环依赖问题修复总结

## 🔍 问题诊断

### 原始问题
用户报告：点击"用户列表"页面后，其他菜单项无法正常渲染，怀疑是 hooks 使用导致的问题。

### 根本原因
经过分析发现，`useApi.ts` 中存在**循环依赖**问题：

1. **`useEffect` 依赖循环**：
   ```typescript
   useEffect(() => {
     // 执行 fetchData
   }, dependencies); // 依赖传入的 dependencies
   ```

2. **`fetchData` 的 `useCallback` 依赖问题**：
   ```typescript
   const fetchData = useCallback(async () => {
     // 使用 apiCallRef.current
   }, []); // 空依赖数组，但内部使用了变化的引用
   ```

3. **`refetch` 的 `useCallback` 依赖问题**：
   ```typescript
   const refetch = useCallback(() => {
     fetchData();
   }, [fetchData]); // 依赖 fetchData，但 fetchData 可能变化
   ```

## 🛠️ 修复方案

### 1. 修复 `useApi` Hook

**主要修改**：
- 分离 `useEffect` 依赖，避免循环
- 使用 `useRef` 稳定 `apiCall` 引用
- 添加延迟执行机制，避免依赖变化时的立即触发

**关键代码**：
```typescript
// 分离依赖处理
useEffect(() => {
  isMountedRef.current = true;
  Promise.resolve().then(() => {
    if (isMountedRef.current) {
      fetchData();
    }
  });
  return () => {
    isMountedRef.current = false;
  };
}, []); // 移除 dependencies 依赖

// 单独处理 dependencies 变化
useEffect(() => {
  if (dependencies.length > 0 && isMountedRef.current) {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        fetchData();
      }
    }, 0);
    return () => clearTimeout(timer);
  }
}, dependencies);
```

### 2. 修复 `Users.tsx` 类型问题

**主要修改**：
- 重新启用自定义 API hooks
- 修复 `User` 和 `Member` 类型不匹配问题
- 正确处理可选字段（`name`, `phone`, `email` 可能为 `undefined`）

**关键代码**：
```typescript
// 使用正确的类型
import type { User } from '../services/api';

// 处理可选字段
render: (name: string | undefined) => name || '-'

// 正确导入 hooks
const { rejectUser, loading: rejectLoading } = useRejectUser();
```

## ✅ 修复效果

### 解决的问题
1. **循环依赖**：hooks 不再无限循环执行
2. **类型错误**：修复了 TypeScript 类型不匹配问题
3. **状态管理**：组件卸载时正确清理状态
4. **React 19 兼容性**：优化了异步操作的执行时机

### 预期结果
- 访问用户列表页面后，其他页面应该能正常渲染
- 不再出现 hooks 相关的控制台错误
- 页面切换更加流畅，没有状态泄漏

## 🧪 测试建议

1. **基本功能测试**：
   - 访问用户列表页面
   - 切换到其他页面（首页、项目列表、任务列表等）
   - 验证页面是否正常渲染

2. **Hooks 功能测试**：
   - 测试用户审批、拒绝功能
   - 测试用户编辑、删除功能
   - 验证加载状态和错误处理

3. **性能测试**：
   - 快速切换页面，观察是否有卡顿
   - 检查控制台是否有错误信息
   - 验证内存使用是否正常

## 🔧 技术细节

### React 19 兼容性
- 使用 `Promise.resolve().then()` 确保异步操作在下一个微任务中执行
- 添加 `isMountedRef` 防止在卸载组件上更新状态
- 使用 `setTimeout` 延迟依赖变化时的重新获取

### 状态清理
- 组件卸载时清理所有本地状态
- 防止状态泄漏影响其他页面
- 使用 `useRef` 跟踪组件挂载状态

## 📝 注意事项

1. **API 调用**：确保后端 API 正常工作
2. **错误处理**：添加了完善的错误边界和用户提示
3. **类型安全**：使用 TypeScript 严格类型检查
4. **性能优化**：避免不必要的重新渲染和 API 调用

## 🚀 下一步

如果修复成功，可以考虑：
1. 逐步恢复其他页面的 hooks 使用
2. 添加更多的错误边界和加载状态
3. 优化 API 调用的缓存策略
4. 添加单元测试验证修复效果 