import { Category } from '../domain/types';
import { CategoryRepo } from './repositories';

export interface CreateCategoryInput {
  goalId: string;
  name: string;
}

export function createCategoryUsecase(categoryRepo: CategoryRepo) {
  return async (input: CreateCategoryInput, userId = 'local') => {
    const now = new Date().toISOString();
    const category: Category = {
      id: crypto.randomUUID(),
      userId,
      goalId: input.goalId,
      name: input.name,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    await categoryRepo.create(category);
    return category;
  };
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
}

export function updateCategoryUsecase(categoryRepo: CategoryRepo) {
  return async (input: UpdateCategoryInput) => {
    const now = new Date().toISOString();
    const existing = await categoryRepo.findById(input.id);
    if (!existing) throw new Error('Category not found');
    const updated: Category = { ...existing, name: input.name, updatedAt: now };
    await categoryRepo.update(updated);
    return updated;
  };
}

export function listCategoriesByGoalUsecase(categoryRepo: CategoryRepo) {
  return async (goalId: string) => categoryRepo.listByGoal(goalId);
}

export function deleteCategoryUsecase(categoryRepo: CategoryRepo) {
  return async (id: string) => {
    const now = new Date().toISOString();
    await categoryRepo.softDelete(id, now);
  };
}
