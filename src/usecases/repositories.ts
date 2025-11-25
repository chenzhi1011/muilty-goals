import { Category, Goal, Task } from '../domain/types';

export interface GoalRepo {
  // 创建目标
  create(goal: Goal): Promise<void>;
  // 更新目标
  update(goal: Goal): Promise<void>;
  // 根据 id 查找
  findById(id: string): Promise<Goal | undefined>;
  // 列出未软删目标
  listActive(): Promise<Goal[]>;
  // 软删
  softDelete(id: string, deletedAt: string): Promise<void>;
}

export interface CategoryRepo {
  // 创建 category
  create(category: Category): Promise<void>;
  // 更新 category
  update(category: Category): Promise<void>;
  // 查找
  findById(id: string): Promise<Category | undefined>;
  // 列出某目标下 category
  listByGoal(goalId: string): Promise<Category[]>;
  // 软删
  softDelete(id: string, deletedAt: string): Promise<void>;
}

export interface TaskRepo {
  // 创建任务
  create(task: Task): Promise<void>;
  // 更新任务
  update(task: Task): Promise<void>;
  // 查找
  findById(id: string): Promise<Task | undefined>;
  // 按 goal 查任务
  listByGoal(goalId: string): Promise<Task[]>;
  // 按日期范围
  listByDateRange(startDate: string, endDate: string): Promise<Task[]>;
  // 按日期
  listByDate(date: string): Promise<Task[]>;
  // 软删
  softDelete(id: string, deletedAt: string): Promise<void>;
}
