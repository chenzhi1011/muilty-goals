import { db } from './db';
import { Category } from '../../domain/types';
import { CategoryRepo } from '../../usecases/repositories';

// Dexie Category 仓储实现
export function createCategoryRepo(): CategoryRepo {
  return {
    async create(category: Category) {
      await db.categories.add(category);
    },
    async update(category: Category) {
      await db.categories.put(category);
    },
    async findById(id: string) {
      return db.categories.get(id);
    },
    async listByGoal(goalId: string) {
      const categories = await db.categories.where('goalId').equals(goalId).toArray();
      return categories.filter((c) => !c.deletedAt);
    },
    async softDelete(id: string, deletedAt: string) {
      const existing = await db.categories.get(id);
      if (!existing) return;
      await db.categories.put({ ...existing, deletedAt, updatedAt: deletedAt });
    }
  };
}
