import Dexie, { Table } from 'dexie';
import { Category, Goal, Task } from '../../domain/types';

export class AppDatabase extends Dexie {
  goals!: Table<Goal>;
  categories!: Table<Category>;
  tasks!: Table<Task>;

  constructor() {
    super('multi_goal_tasks_db');
    this.version(1).stores({
      goals: 'id, userId, deletedAt',
      categories: 'id, goalId, userId, deletedAt',
      tasks: 'id, date, goalId, categoryId, userId, deletedAt, done'
    });
  }
}

export const db = new AppDatabase();
