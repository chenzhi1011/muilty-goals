import { Goal, GoalType } from '../domain/types';
import { GoalRepo, TaskRepo } from './repositories';

export interface CreateGoalInput {
  name: string;
  type: GoalType;
  startDate: string;
  endDate?: string | null;
  importance: number;
  color: string;
}

// 创建目标
export function createGoalUsecase(goalRepo: GoalRepo) {
  return async (input: CreateGoalInput, userId = 'local') => {
    const now = new Date().toISOString();
    const goal: Goal = {
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      type: input.type,
      startDate: input.startDate,
      endDate: input.type === 'project' ? input.endDate ?? null : null,
      importance: input.importance,
      color: input.color,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    await goalRepo.create(goal);
    return goal;
  };
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
  id: string;
}

// 更新目标
export function updateGoalUsecase(goalRepo: GoalRepo, taskRepo?: TaskRepo) {
  return async (input: UpdateGoalInput) => {
    const existing = await goalRepo.findById(input.id);
    if (!existing) throw new Error('Goal not found');
    const now = new Date().toISOString();
    const updated: Goal = {
      ...existing,
      ...input,
      endDate: input.type === 'project' ? input.endDate ?? existing.endDate ?? null : null,
      updatedAt: now
    };
    await goalRepo.update(updated);
    // 如果颜色改变，更新关联任务颜色
    if (taskRepo && input.color && input.color !== existing.color) {
      const tasks = await taskRepo.listByGoal(updated.id);
      await Promise.all(
        tasks.map((task) =>
          taskRepo.update({
            ...task,
            color: input.color!,
            updatedAt: now
          })
        )
      );
    }
    return updated;
  };
}

export function deleteGoalUsecase(goalRepo: GoalRepo) {
  return async (id: string) => {
    const now = new Date().toISOString();
    await goalRepo.softDelete(id, now);
  };
}

// 软删目标并解绑任务
export function deleteGoalAndDetachTasksUsecase(goalRepo: GoalRepo, taskRepo: TaskRepo) {
  return async (id: string) => {
    const now = new Date().toISOString();
    await goalRepo.softDelete(id, now);
    const tasks = await taskRepo.listByGoal(id);
    await Promise.all(
      tasks.map((task) =>
        taskRepo.update({
          ...task,
          goalId: null,
          categoryId: null,
          color: '#94a3b8',
          updatedAt: now
        })
      )
    );
  };
}

export function listActiveGoalsUsecase(goalRepo: GoalRepo) {
  return async () => {
    return goalRepo.listActive();
  };
}
