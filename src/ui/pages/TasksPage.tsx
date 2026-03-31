import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Goal, Task } from '../../domain/types';
import { useServices } from '../state/AppProvider';
import { TaskEditorModal } from '../components/TaskEditorModal';
import { getWeekDays, todayISO } from '../../utils/date';

type Props = {
  onNavigateGoals?: () => void;
};

type TasksView = 'done' | 'memo';
type MemoTask = {
  id: string;
  title: string;
  description: string;
};

const MEMO_TASKS_KEY = 'memo_tasks_v1';

function lightenHex(hex: string, amount: number) {
  const normalized = hex.replace('#', '');
  const safeHex = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => char + char)
        .join('')
    : normalized.padEnd(6, '0').slice(0, 6);

  const num = Number.parseInt(safeHex, 16);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const r = clamp(mix((num >> 16) & 255));
  const g = clamp(mix((num >> 8) & 255));
  const b = clamp(mix(num & 255));

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export default function TasksPage({ onNavigateGoals }: Props) {
  const services = useServices();
  const memoLongPressTimerRef = useRef<number | null>(null);
  const memoLongPressIdRef = useRef<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [view, setView] = useState<TasksView>('done');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memoTasks, setMemoTasks] = useState<MemoTask[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDraft, setTaskDraft] = useState<{ title?: string; description?: string | null } | null>(null);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoTitle, setMemoTitle] = useState('');
  const [memoDescription, setMemoDescription] = useState('');

  const goalMap = useMemo(() => new Map(goals.map((goal) => [goal.id, goal])), [goals]);

  useEffect(() => {
    services.goals.listActive().then(setGoals);
  }, [services.goals]);

  useEffect(() => {
    void refreshTasks(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    void ensureDemoData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(MEMO_TASKS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as MemoTask[];
      if (Array.isArray(parsed)) setMemoTasks(parsed);
    } catch {
      // ignore malformed persisted state
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MEMO_TASKS_KEY, JSON.stringify(memoTasks));
  }, [memoTasks]);

  async function ensureDemoData() {
    const existing = await services.tasks.listByRange('0000-01-01', '9999-12-31');
    if (existing.length > 0) return;

    const base = todayISO();
    const demo = [
      { title: 'Deep Focus Session', date: base, color: '#8a86d0' },
      { title: 'Inbox Zero Sprint', date: base, color: '#ceccf3' },
      { title: 'Workout Reset', date: base, color: '#e0f0c7' },
      { title: 'Read 15 Pages', date: base, color: '#8a86d0' }
    ];

    for (const item of demo) {
      await services.tasks.create(item);
    }

    await refreshTasks(base);
  }

  async function refreshTasks(date: string) {
    const list = await services.tasks.listByDate(date);
    setTasks(list);
  }

  async function handleToggle(task: Task) {
    await services.tasks.toggleDone(task.id, !task.done);
    await refreshTasks(selectedDate);
  }

  function resetMemoForm() {
    setEditingMemoId(null);
    setMemoTitle('');
    setMemoDescription('');
  }

  function closeMemoModal() {
    setShowMemoModal(false);
    resetMemoForm();
  }

  function handleSaveMemo() {
    if (!memoTitle.trim()) return;
    if (editingMemoId) {
      setMemoTasks((prev) =>
        prev.map((memo) =>
          memo.id === editingMemoId
            ? { ...memo, title: memoTitle.trim(), description: memoDescription.trim() }
            : memo
        )
      );
      closeMemoModal();
      return;
    }
    setMemoTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: memoTitle.trim(),
        description: memoDescription.trim()
      }
    ]);
    closeMemoModal();
  }

  function handleEditMemo(memo: MemoTask) {
    setEditingMemoId(memo.id);
    setMemoTitle(memo.title);
    setMemoDescription(memo.description);
    setShowMemoModal(true);
  }

  function handleDeleteMemo(id: string) {
    setMemoTasks((prev) => prev.filter((memo) => memo.id !== id));
    if (editingMemoId === id) resetMemoForm();
  }

  function handleMemoLongPress(memo: MemoTask) {
    memoLongPressIdRef.current = memo.id;
    setTaskDraft({ title: memo.title, description: memo.description || null });
    setEditingTask(null);
    setShowCreateModal(true);
  }

  function clearMemoLongPressTimer() {
    if (memoLongPressTimerRef.current) {
      window.clearTimeout(memoLongPressTimerRef.current);
      memoLongPressTimerRef.current = null;
    }
  }

  function startMemoLongPress(memo: MemoTask) {
    clearMemoLongPressTimer();
    memoLongPressTimerRef.current = window.setTimeout(() => {
      handleMemoLongPress(memo);
    }, 450);
  }

  function finishMemoPress(memo: MemoTask) {
    clearMemoLongPressTimer();
    return memoLongPressIdRef.current === memo.id;
  }

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const titleDate = useMemo(() => dayjs(selectedDate).format('D MMM, YYYY'), [selectedDate]);
  const monthLabel = useMemo(() => dayjs(selectedDate).format('MMMM YYYY'), [selectedDate]);
  const greeting = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 12) return 'Hi, user!';
    if (hour < 18) return 'Good day!';
    return 'Good evening!';
  }, []);
  const monthDays = useMemo(() => {
    const current = dayjs(selectedDate);
    const monthEnd = current.endOf('month');
    const daysUntilMonthEnd = monthEnd.diff(current, 'day');

    const start = daysUntilMonthEnd <= 10
      ? monthEnd.subtract(9, 'day')
      : current.startOf('month').subtract((current.startOf('month').day() + 6) % 7, 'day');

    return Array.from({ length: 28 }, (_, index) => start.add(index, 'day'));
  }, [selectedDate]);

  return (
    <>
      <div className="tasks-screen">
        <div className="tasks-phone">
          <div className={`tasks-hero ${isCalendarExpanded ? 'is-calendar-expanded' : ''}`}>
            <div className="tasks-stars" aria-hidden="true">
              <span className="star star-a" />
              <span className="star star-b" />
              <span className="star star-c" />
              <span className="star star-d" />
              <span className="star star-e" />
            </div>

            <div className="tasks-hero-top">
              <div className="tasks-orbit" aria-hidden="true">
                <span className="orbit-center" />
                <span className="orbit-ring orbit-ring-one" />
                <span className="orbit-ring orbit-ring-two" />
                <span className="orbit-dot orbit-dot-one" />
                <span className="orbit-dot orbit-dot-two" />
                <span className="orbit-dot orbit-dot-three" />
              </div>
              <div className="tasks-greeting">{greeting}</div>
            </div>

            <div className="tasks-date-row">
              <div className="tasks-date-label">{titleDate}</div>
              <button
                className={`tasks-date-toggle ${isCalendarExpanded ? 'is-expanded' : ''}`}
                onClick={() => setIsCalendarExpanded((prev) => !prev)}
                aria-label="Toggle month calendar"
              >
                <span>⌄</span>
              </button>
            </div>

            {isCalendarExpanded ? (
              <div className="tasks-month-calendar">
                <div className="tasks-month-title">{monthLabel}</div>
                <div className="tasks-month-grid">
                  {monthDays.map((day) => {
                    const iso = day.format('YYYY-MM-DD');
                    const isSelected = iso === selectedDate;
                    const isToday = iso === todayISO();
                    const isCurrentMonth = day.month() === dayjs(selectedDate).month();
                    return (
                      <button
                        key={iso}
                        className={[
                          'tasks-month-day',
                          isSelected ? 'is-selected' : '',
                          isToday ? 'is-today' : '',
                          isCurrentMonth ? '' : 'is-outside'
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => {
                          setSelectedDate(iso);
                          setIsCalendarExpanded(false);
                        }}
                      >
                        <span>{day.format('ddd')}</span>
                        <strong>{day.format('D')}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="tasks-week-strip">
                {weekDays.map((day) => {
                  const isActive = day === selectedDate;
                  return (
                    <button
                      key={day}
                      className={`tasks-week-day ${isActive ? 'is-active' : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <span>{dayjs(day).format('ddd')}</span>
                      <strong>{dayjs(day).format('D')}</strong>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="tasks-hero-curve" aria-hidden="true" />
          </div>

          <section className="tasks-panel">
            <div className="tasks-panel-header">
              <div className="tasks-panel-heading">
                <h1>{view === 'done' ? 'DoneList' : 'Memo Tasks'}</h1>
                {view === 'memo' && (
                  <button type="button" className="tasks-back-button" onClick={() => setView('done')}>
                    Back
                  </button>
                )}
              </div>
              <button
                className="tasks-idea-button"
                onClick={() => {
                  if (view === 'done') {
                    setView('memo');
                    resetMemoForm();
                    return;
                  }
                  setShowMemoModal(true);
                }}
                aria-label={view === 'done' ? 'Open memo tasks' : 'Reset memo form'}
              >
                <span className="tasks-bulb" aria-hidden="true" />
              </button>
            </div>

            {view === 'done' ? (
              <>
                <div className="tasks-list">
                  {tasks.map((task) => {
                    const goal = task.goalId ? goalMap.get(task.goalId) : null;
                    const baseColor = goal?.color ?? task.color ?? '#8a86d0';
                    const bgColor = task.done ? lightenHex(baseColor, 0.55) : baseColor;
                    return (
                      <div
                        key={task.id}
                        className={`task-card ${task.done ? 'is-done' : ''}`}
                        style={{ backgroundColor: bgColor }}
                      >
                        <button
                          type="button"
                          className="task-card__planet-button"
                          onClick={() => {
                            setTaskDraft(null);
                            setEditingTask(task);
                            setShowCreateModal(true);
                          }}
                          aria-label={`Edit ${task.title}`}
                        >
                          <div className="task-card__planet" aria-hidden="true">
                            <span className="planet-core" />
                            <span className="planet-ring" />
                          </div>
                        </button>
                        <button
                          type="button"
                          className="task-card__main"
                          onClick={() => void handleToggle(task)}
                        >
                          <div className="task-card__body">
                            <div className="task-card__title">{task.title}</div>
                            <div className="task-card__goal">{goal?.name ?? 'Goal 1'}</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="task-card__check-button"
                          onClick={() => void handleToggle(task)}
                          aria-label={task.done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
                        >
                          <span className={`task-card__check ${task.done ? 'is-checked' : ''}`} aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}

                  {tasks.length === 0 && (
                    <div className="tasks-empty">
                      <p>No tasks for this day.</p>
                      <button className="tasks-empty-action" onClick={() => {
                        setTaskDraft(null);
                        setEditingTask(null);
                        setShowCreateModal(true);
                      }}>
                        Create one
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className="tasks-add-fab"
                  onClick={() => {
                    setTaskDraft(null);
                    setEditingTask(null);
                    setShowCreateModal(true);
                  }}
                  aria-label="Create task"
                >
                  +
                </button>
              </>
            ) : (
              <div className="memo-page">
                <button
                  type="button"
                  className="memo-open-button"
                  onClick={() => {
                    resetMemoForm();
                    setShowMemoModal(true);
                  }}
                >
                  + Add memo
                </button>

                <div className="memo-list">
                  {memoTasks.map((memo) => (
                    <div
                      key={memo.id}
                      className="memo-card"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleMemoLongPress(memo);
                      }}
                    >
                      <button
                        type="button"
                        className="memo-card__body"
                        onClick={() => {
                          if (memoLongPressIdRef.current === memo.id) {
                            memoLongPressIdRef.current = null;
                            return;
                          }
                          handleEditMemo(memo);
                        }}
                        onPointerDown={() => startMemoLongPress(memo)}
                        onPointerUp={() => {
                          finishMemoPress(memo);
                        }}
                        onPointerLeave={() => {
                          clearMemoLongPressTimer();
                        }}
                        onPointerCancel={() => {
                          clearMemoLongPressTimer();
                          if (memoLongPressIdRef.current === memo.id) {
                            memoLongPressIdRef.current = null;
                          }
                        }}
                      >
                        <div className="memo-card__title">{memo.title}</div>
                        <div className="memo-card__description">{memo.description || 'No description'}</div>
                      </button>
                      <button
                        type="button"
                        className="memo-card__delete"
                        onClick={() => handleDeleteMemo(memo.id)}
                        aria-label={`Delete ${memo.title}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {memoTasks.length === 0 && (
                    <div className="tasks-empty memo-empty">
                      <p>No memo tasks yet.</p>
                      <span>Use the form above to add one.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <nav className="tasks-bottom-nav" aria-label="Primary">
            <button className="is-active">Done</button>
            <button onClick={onNavigateGoals}>Planets</button>
          </nav>
        </div>
      </div>

      <TaskEditorModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTask(null);
          setTaskDraft(null);
        }}
        defaultDate={selectedDate}
        goals={goals}
        task={editingTask}
        draft={taskDraft}
        onCreated={() => void refreshTasks(selectedDate)}
      />

      {showMemoModal && (
        <div className="memo-modal-backdrop" onClick={closeMemoModal}>
          <div className="memo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="memo-modal__header">
              <h3>{editingMemoId ? 'Edit memo' : 'Add memo'}</h3>
              <button type="button" className="memo-modal__close" onClick={closeMemoModal}>
                ×
              </button>
            </div>
            <label className="memo-editor__field">
              <span>Name</span>
              <input
                value={memoTitle}
                onChange={(e) => setMemoTitle(e.target.value)}
                placeholder="Memo task name"
              />
            </label>
            <label className="memo-editor__field">
              <span>Description</span>
              <textarea
                value={memoDescription}
                onChange={(e) => setMemoDescription(e.target.value)}
                placeholder="Short description"
              />
            </label>
            <div className="memo-editor__actions">
              <button type="button" className="memo-action secondary" onClick={closeMemoModal}>
                Cancel
              </button>
              <button type="button" className="memo-action" onClick={handleSaveMemo}>
                {editingMemoId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
