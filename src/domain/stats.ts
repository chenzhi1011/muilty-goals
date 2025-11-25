import dayjs from 'dayjs';
import { Task, WeeklyGoalStat } from './types';

// 按目标聚合一周任务数量（默认仅统计已完成）
export function computeWeeklyStats(tasks: Task[], options?: { doneOnly?: boolean }): WeeklyGoalStat[] {
  const doneOnly = options?.doneOnly ?? true;
  const grouped = new Map<string, WeeklyGoalStat>();
  tasks.forEach((task) => {
    if (doneOnly && !task.done) return;
    const key = task.goalId ?? 'unassigned';
    const stat = grouped.get(key) ?? {
      goalId: task.goalId ?? null,
      goalName: task.goalId ? '' : '自由任务',
      color: task.goalId ? task.color : '#94a3b8',
      count: 0
    };
    grouped.set(key, { ...stat, count: stat.count + 1 });
  });
  return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
}

// 判断是否同一天
export function isSameDay(a: string, b: string) {
  return dayjs(a).isSame(dayjs(b), 'day');
}
