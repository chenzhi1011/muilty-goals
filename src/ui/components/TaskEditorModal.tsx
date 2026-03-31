import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useServices } from '../state/AppProvider';
import { Goal, Task } from '../../domain/types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  goals: Goal[];
  task?: Task | null;
  draft?: {
    title?: string;
    description?: string | null;
    goalId?: string | null;
    date?: string;
  } | null;
  onCreated?: (task: Task) => void;
}

const WEEKDAY_OPTIONS = [
  { label: 'M', day: 1 },
  { label: 'T', day: 2 },
  { label: 'W', day: 3 },
  { label: 'T', day: 4 },
  { label: 'F', day: 5 },
  { label: 'S', day: 6 },
  { label: 'S', day: 0 }
];

export function TaskEditorModal({ open, onClose, defaultDate, goals, task, draft, onCreated }: Props) {
  const services = useServices();
  const [title, setTitle] = useState('');
  const [goalId, setGoalId] = useState<string | ''>('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setGoalId(task.goalId ?? '');
      setNotes(task.description ?? '');
      setStartDate(task.date);
      setEndDate(task.date);
      setSelectedDays([]);
      return;
    }
    setTitle(draft?.title ?? '');
    setGoalId(draft?.goalId ?? '');
    setNotes(draft?.description ?? '');
    setStartDate(draft?.date ?? defaultDate);
    setEndDate(draft?.date ?? defaultDate);
    setSelectedDays([]);
  }, [defaultDate, draft, open, task]);

  const selectedGoal = useMemo(() => goals.find((goal) => goal.id === goalId), [goals, goalId]);

  if (!open) return null;

  function toggleRepeatDay(day: number) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));
  }

  function buildDatesToCreate() {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (!start.isValid()) return [];
    if (!end.isValid() || end.isBefore(start, 'day')) return [start.format('YYYY-MM-DD')];
    if (selectedDays.length === 0) return [start.format('YYYY-MM-DD')];

    const dates: string[] = [];
    let cursor = start.startOf('day');
    const limit = end.startOf('day');

    while (cursor.isBefore(limit, 'day') || cursor.isSame(limit, 'day')) {
      if (selectedDays.includes(cursor.day())) {
        dates.push(cursor.format('YYYY-MM-DD'));
      }
      cursor = cursor.add(1, 'day');
    }

    return dates.length > 0 ? dates : [start.format('YYYY-MM-DD')];
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setLoading(true);

    try {
      if (task) {
        const updated = await services.tasks.update({
          id: task.id,
          title: title.trim(),
          date: startDate,
          goalId: goalId || null,
          description: notes.trim() || null,
          color: selectedGoal?.color ?? task.color ?? '#8a86d0'
        });
        onCreated?.(updated);
        onClose();
        return;
      }

      const taskDates = buildDatesToCreate();
      const created: Task[] = [];

      for (const date of taskDates) {
        const task = await services.tasks.create({
          title: title.trim(),
          date,
          goalId: goalId || null,
          description: notes.trim() || null,
          color: selectedGoal?.color ?? '#8a86d0'
        });
        created.push(task);
      }

      if (created[0]) onCreated?.(created[0]);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="task-sheet-backdrop" onClick={onClose}>
      <div className="task-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="task-sheet__handle" />

        <div className="task-sheet__header">
          <button className="task-sheet__close" onClick={onClose} disabled={loading} aria-label="Close">
            ×
          </button>
          <button className="task-sheet__done" onClick={() => void handleSubmit()} disabled={loading}>
            Done
          </button>
        </div>

        <div className="task-sheet__content">
          <label className="task-sheet__field">
            <span>Todo Name</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design Voyager Module"
            />
          </label>

          <div className="task-sheet__field">
            <span>Link to Goal (Planet)</span>
            <div className="task-sheet__goals" role="list">
              <button
                className={`task-goal-chip ${goalId === '' ? 'is-active' : ''}`}
                onClick={() => setGoalId('')}
                type="button"
              >
                <span className="task-goal-chip__planet" />
                <span className="task-goal-chip__label">Free</span>
              </button>

              {goals.map((goal) => (
                <button
                  key={goal.id}
                  className={`task-goal-chip ${goalId === goal.id ? 'is-active' : ''}`}
                  onClick={() => setGoalId(goal.id)}
                  type="button"
                >
                  <span className="task-goal-chip__planet" style={{ background: goal.color }} />
                  <span className="task-goal-chip__label">{goal.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="task-sheet__field">
            <span>Timeline</span>
            <div className="task-sheet__dates">
              <label className="task-date-card">
                <small>Start Date</small>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label className="task-date-card">
                <small>End Date</small>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
            </div>
          </div>

          {!task && (
            <div className="task-sheet__field">
              <div className="task-sheet__repeat-head">
                <span>Repeat Weekly</span>
                <small>{selectedDays.length > 0 ? 'On Selected Days' : 'One-time Task'}</small>
              </div>
              <div className="task-sheet__repeat-days">
                {WEEKDAY_OPTIONS.map((option, index) => {
                  const active = selectedDays.includes(option.day);
                  return (
                    <button
                      key={`${option.label}-${index}`}
                      className={`task-repeat-day ${active ? 'is-active' : ''}`}
                      onClick={() => toggleRepeatDay(option.day)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="task-sheet__field">
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add some context..."
            />
          </label>
        </div>
      </div>
    </div>
  );
}
