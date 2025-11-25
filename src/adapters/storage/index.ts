import { createCategoryRepo } from './categoryRepo';
import { createGoalRepo } from './goalRepo';
import { createTaskRepo } from './taskRepo';

export function createRepositories() {
  return {
    goalRepo: createGoalRepo(),
    categoryRepo: createCategoryRepo(),
    taskRepo: createTaskRepo()
  };
}
