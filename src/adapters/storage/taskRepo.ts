import dayjs from 'dayjs';
import { db } from './db';
import { Task } from '../../domain/types';
import { TaskRepo } from '../../usecases/repositories';

// Dexie 任务仓储实现
export function createTaskRepo(): TaskRepo {
  return {
    async create(task: Task) {
      await db.tasks.add(task);
    },
    async update(task: Task) {
      await db.tasks.put(task);
    },
    async findById(id: string) {
      return db.tasks.get(id);
    },
    async listByGoal(goalId: string) {
      const tasks = await db.tasks.where('goalId').equals(goalId).toArray();
      return tasks.filter((t) => !t.deletedAt);
    },
    async listByDate(date: string) {
      const tasks = await db.tasks.where('date').equals(date).toArray();
      return tasks.filter((t) => !t.deletedAt);
    },
    async listByDateRange(startDate: string, endDate: string) {
      const tasks = await db.tasks
        .filter((t) => {
          if (t.deletedAt) return false;
          const d = dayjs(t.date);
          return (d.isAfter(startDate) || d.isSame(startDate)) && (d.isBefore(endDate) || d.isSame(endDate));
        })
        .toArray();
      return tasks;
    },
    async softDelete(id: string, deletedAt: string) {
      const existing = await db.tasks.get(id);
      if (!existing) return;
      await db.tasks.put({ ...existing, deletedAt, updatedAt: deletedAt });
    }
  };
}
