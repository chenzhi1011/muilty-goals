import dayjs from 'dayjs';
import { Task } from '../domain/types';
import { TaskRepo } from './repositories';

export interface CreateTaskInput {
  title: string;
  date: string;
  description?: string | null;
  goalId?: string | null;
  categoryId?: string | null;
  color: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

// 创建任务
export function createTaskUsecase(taskRepo: TaskRepo) {
  return async (input: CreateTaskInput, userId = 'local') => {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      userId,
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      goalId: input.goalId ?? null,
      categoryId: input.categoryId ?? null,
      color: input.color,
      done: false,
      doneAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    await taskRepo.create(task);
    return task;
  };
}

// 勾选/取消完成
export function toggleTaskDoneUsecase(taskRepo: TaskRepo) {
  return async (id: string, done: boolean) => {
    const now = new Date().toISOString();
    const task = await taskRepo.findById(id);
    if (!task) throw new Error('Task not found');
    const updated: Task = {
      ...task,
      done,
      doneAt: done ? now : null,
      updatedAt: now
    };
    await taskRepo.update(updated);
    return updated;
  };
}

// 更新任务
export function updateTaskUsecase(taskRepo: TaskRepo) {
  return async (input: UpdateTaskInput) => {
    const existing = await taskRepo.findById(input.id);
    if (!existing) throw new Error('Task not found');
    const now = new Date().toISOString();
    const updated: Task = {
      ...existing,
      ...input,
      updatedAt: now
    };
    await taskRepo.update(updated);
    return updated;
  };
}

// 按日期范围列出
export function listTasksByDateRangeUsecase(taskRepo: TaskRepo) {
  return async (startDate: string, endDate: string) => {
    return taskRepo.listByDateRange(startDate, endDate);
  };
}

// 按日期列出
export function listTasksByDateUsecase(taskRepo: TaskRepo) {
  return async (date: string) => {
    return taskRepo.listByDate(date);
  };
}

// 软删任务
export function deleteTaskUsecase(taskRepo: TaskRepo) {
  return async (id: string) => {
    const now = new Date().toISOString();
    await taskRepo.softDelete(id, now);
  };
}

// 计算包含某日期的周一、周日
export function weekRange(date: string) {
  const d = dayjs(date);
  const start = d.subtract((d.day() + 6) % 7, 'day'); // Monday containing the date (even if date is Sunday)
  const end = start.add(6, 'day');
  return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') };
}
