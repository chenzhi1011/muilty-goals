import React from 'react';
import { Task } from '../../domain/types';

interface Props {
  task: Task;
  goalName?: string;
  onToggle: (id: string, done: boolean) => void;
}

export function TaskItem({ task, goalName, onToggle }: Props) {
  return (
    <div
      className="card"
      style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderLeft: `6px solid ${task.color}`,
        opacity: task.done ? 0.6 : 1
      }}
    >
      <input type="checkbox" checked={task.done} onChange={(e) => onToggle(task.id, e.target.checked)} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</div>
        {goalName && (
          <div className="chip" style={{ marginTop: 6 }}>
            🎯 {goalName}
          </div>
        )}
      </div>
    </div>
  );
}
