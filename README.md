# GoalFlow (Multi Goal Tasks)

极简多目标 + 任务管理 PWA，React + TypeScript + Vite，数据本地 IndexedDB（Dexie），无登录、可离线。

## 快速开始

```bash
npm install
npm run dev
# 打开 http://localhost:5173
```

## 构建 & 预览

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，为纯静态文件。

## 部署到 Vercel（静态）

1. 在 Vercel 新建项目，导入此仓库。  
2. Build Command：`npm run build`  
3. Output Directory：`dist`  
4. Framework Preset：`Vite`  
5. 部署后即为可安装的 PWA（自动注册 Service Worker）。

## 架构分层

- `domain/`：实体定义、纯函数统计。  
- `usecases/`：业务流程（创建/更新/删除/列表/统计）。  
- `adapters/storage/`：Dexie IndexedDB 实现的仓储。  
- `ui/`：React 组件与页面，仅调用 usecases。  

数据模型均包含 `userId`（MVP 固定 `local`）、`updatedAt`、`deletedAt`（软删）。

## 目录说明（主要文件作用）

- `vite.config.ts`：Vite + PWA 插件配置（injectManifest）。
- `src/main.tsx`：入口，注册 PWA，挂载 App。
- `src/App.tsx`：顶部品牌 + 底部导航，切换 Tasks/Goals 页面。
- `src/index.css`：全局样式、记事本列表、周网格等 UI。
- `src/domain/types.ts`：Goal/Category/Task 类型定义。
- `src/domain/stats.ts`：周统计等纯函数。
- `src/usecases/*`：业务用例（创建/更新/删除/列表/周区间计算）。
- `src/adapters/storage/db.ts`：Dexie 实例定义。
- `src/adapters/storage/*Repo.ts`：Goal/Category/Task 的 Dexie 仓储实现。
- `src/utils/date.ts`：日期工具（今日、周数组、格式化）。
- `src/ui/state/AppProvider.tsx`：创建仓储与 usecase，提供 context。
- `src/ui/pages/TasksPage.tsx`：日/周/占位月视图，记事本风格列表、周网格。
- `src/ui/pages/GoalsPage.tsx`：目标悬浮球列表、详情弹层、类别 CRUD。
- `src/ui/components/*`：编辑弹窗与任务项（部分已内联简化后未使用，可按需复用）。

## 目录作用概览（不含 dist、node_modules）

- `src/`：前端业务与 UI 代码。
- `src/domain/`：领域模型定义与纯函数（无存储/网络耦合）。
- `src/usecases/`：业务用例封装，组合仓储和领域逻辑。
- `src/adapters/`：适配层；`storage/` 使用 Dexie 持久化到 IndexedDB。
- `src/ui/`：React UI；`pages/` 页面，`components/` 通用组件，`state/` 依赖注入。
- `public/`：静态资源（favicon、PWA 图标、robots）。
- 配置根目录：`vite.config.ts`、`tsconfig*.json` 等构建/类型配置。
## MVP 功能概览

- TasksPage：Day/Week/Month 视图（Month 为占位）；新增任务（可选关联目标/类别）；完成勾选；周度投入统计。  
- GoalsPage：目标卡片列表（ongoing/project），新增/编辑/删除（软删并解关联任务），类别/步骤 CRUD。  
- 数据：IndexedDB 持久化；目标色自动继承到关联任务；自由任务可自定义颜色。  
- PWA：`vite-plugin-pwa` 离线 App Shell，自动更新 Service Worker。
