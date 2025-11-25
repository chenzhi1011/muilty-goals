import { db } from './db';
import { Goal } from '../../domain/types';
import { GoalRepo } from '../../usecases/repositories';

// Dexie 目标仓储实现
export function createGoalRepo(): GoalRepo {
  return {
    async create(goal: Goal) {
      await db.goals.add(goal);
    },
    async update(goal: Goal) {
      await db.goals.put(goal);
    },
    async findById(id: string) {
      return db.goals.get(id);
    },
    async listActive() {
      const goals = await db.goals.toArray();
      return goals.filter((g) => !g.deletedAt);
    },
    async softDelete(id: string, deletedAt: string) {
      const existing = await db.goals.get(id);
      if (!existing) return;
      await db.goals.put({ ...existing, deletedAt, updatedAt: deletedAt });
    }
  };
}
