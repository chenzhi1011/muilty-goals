// 目标类型：持续 or 项目
export type GoalType = 'ongoing' | 'project';

// 目标实体：包含颜色、起止、重要度、软删字段
export interface Goal {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  startDate: string;
  endDate?: string | null;
  importance: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// Category/步骤实体：归属 goal
export interface Category {
  id: string;
  userId: string;
  goalId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// 任务实体：可选关联目标/类别，带颜色、完成状态
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  goalId?: string | null;
  categoryId?: string | null;
  color: string;
  done: boolean;
  doneAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// 周统计 DTO：按目标聚合计数
export interface WeeklyGoalStat {
  goalId: string | null;
  goalName: string;
  color: string;
  count: number;
}
