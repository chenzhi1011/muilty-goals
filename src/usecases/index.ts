import {
  createGoalUsecase,
  deleteGoalAndDetachTasksUsecase,
  listActiveGoalsUsecase,
  updateGoalUsecase
} from './goals';
import {
  createTaskUsecase,
  deleteTaskUsecase,
  listTasksByDateRangeUsecase,
  listTasksByDateUsecase,
  toggleTaskDoneUsecase,
  updateTaskUsecase
} from './tasks';
import {
  createCategoryUsecase,
  deleteCategoryUsecase,
  listCategoriesByGoalUsecase,
  updateCategoryUsecase
} from './categories';
import { CategoryRepo, GoalRepo, TaskRepo } from './repositories';

export function createUsecases(repos: { goalRepo: GoalRepo; categoryRepo: CategoryRepo; taskRepo: TaskRepo }) {
  const goalRepo = repos.goalRepo;
  const categoryRepo = repos.categoryRepo;
  const taskRepo = repos.taskRepo;

  return {
    goals: {
      create: createGoalUsecase(goalRepo),
      update: updateGoalUsecase(goalRepo, taskRepo),
      delete: deleteGoalAndDetachTasksUsecase(goalRepo, taskRepo),
      listActive: listActiveGoalsUsecase(goalRepo)
    },
    categories: {
      create: createCategoryUsecase(categoryRepo),
      update: updateCategoryUsecase(categoryRepo),
      delete: deleteCategoryUsecase(categoryRepo),
      listByGoal: listCategoriesByGoalUsecase(categoryRepo)
    },
    tasks: {
      create: createTaskUsecase(taskRepo),
      toggleDone: toggleTaskDoneUsecase(taskRepo),
      delete: deleteTaskUsecase(taskRepo),
      update: updateTaskUsecase(taskRepo),
      listByRange: listTasksByDateRangeUsecase(taskRepo),
      listByDate: listTasksByDateUsecase(taskRepo)
    }
  };
}

export type Usecases = ReturnType<typeof createUsecases>;
