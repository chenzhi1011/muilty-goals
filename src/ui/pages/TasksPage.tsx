import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Goal, Task } from '../../domain/types';
import { useServices } from '../state/AppProvider';
import { computeWeeklyStats } from '../../domain/stats';
import { getWeekDays, monthLabel, todayISO } from '../../utils/date';
import { weekRange } from '../../usecases/tasks';

type ViewMode = 'day' | 'week' | 'month';

export default function TasksPage() {
  const services = useServices();
  // 视图切换与输入状态
  const [view, setView] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  const [dayInput, setDayInput] = useState('');
  const [weekInputs, setWeekInputs] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalGoalId, setModalGoalId] = useState<string | ''>('');
  const [modalColor, setModalColor] = useState('#0ea5e9');
  const [memoMode, setMemoMode] = useState(false);
  const [memoItems, setMemoItems] = useState<{ id: string; title: string; goalId?: string | null; color: string }[]>([
    { id: 'm1', title: '记录灵感', goalId: null, color: '#0ea5e9' },
    { id: 'm2', title: '备忘：购物清单', goalId: null, color: '#0ea5e9' }
  ]);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoTitle, setMemoTitle] = useState('');
  const [memoGoalId, setMemoGoalId] = useState<string | ''>('');

  // 目标映射便于取名/颜色
  const goalMap = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);

  const MEMO_STORAGE_KEY = 'memo_items';

  useEffect(() => {
    services.goals.listActive().then(setGoals);
  }, [services.goals]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedDate]);

  // 根据视图刷新任务
  const refresh = () => {
    if (view === 'day') {
      services.tasks.listByDate(selectedDate).then(setDayTasks);
    } else if (view === 'week') {
      const range = weekRange(selectedDate);
      services.tasks.listByRange(range.start, range.end).then(setWeekTasks);
    }
  };

  // 勾选任务
  const handleToggle = async (id: string, done: boolean) => {
    await services.tasks.toggleDone(id, done);
    refresh();
  };

  // 删除任务
  const handleDelete = async (id: string) => {
    await services.tasks.delete(id);
    refresh();
  };

  // 快速新增任务
  const handleCreateQuick = async (title: string, date: string) => {
    if (!title.trim()) return;
    await services.tasks.create({
      title: title.trim(),
      description: null,
      date,
      color: '#0ea5e9'
    });
    refresh();
  };

  // seed demo data once for presentation if empty
  useEffect(() => {
    (async () => {
      const existing = await services.tasks.listByRange('0000-01-01', '9999-12-31');
      if (existing.length > 0) return;
      const base = todayISO();
      const demo = [
        { title: '晨间拉伸 10 分钟', date: base },
        { title: '写 20 分钟代码', date: base },
        { title: '阅读 15 分钟', date: dayjs(base).add(1, 'day').format('YYYY-MM-DD') },
        { title: '复盘与计划', date: dayjs(base).add(2, 'day').format('YYYY-MM-DD') }
      ];
      for (const t of demo) {
        await services.tasks.create({ title: t.title, date: t.date, color: '#0ea5e9' });
      }
      refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 从本地加载备忘
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(MEMO_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMemoItems(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse memo items', e);
      }
    }
  }, []);

  // 保存备忘到本地
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(memoItems));
  }, [memoItems]);

  const daysOfWeek = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  // 周任务按天分组
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    daysOfWeek.forEach((d) => (map[d] = []));
    weekTasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    Object.keys(map).forEach((d) => (map[d] = map[d].slice().sort((a, b) => Number(a.done) - Number(b.done))));
    return map;
  }, [weekTasks, daysOfWeek]);
  // 周统计
  const weeklyStats = useMemo(() => computeWeeklyStats(weekTasks, { doneOnly: true }), [weekTasks]);

  const handleCreateFromModal = async () => {
    if (!modalTitle.trim()) return;
    const goal = modalGoalId ? goalMap.get(modalGoalId) : null;
    if (editingTaskId) {
      await services.tasks.update({
        id: editingTaskId,
        title: modalTitle.trim(),
        description: modalDesc.trim() || null,
        goalId: modalGoalId || null,
        color: goal ? goal.color : modalColor
      });
    } else {
      await services.tasks.create({
        title: modalTitle.trim(),
        description: modalDesc.trim() || null,
        date: selectedDate,
        goalId: modalGoalId || null,
        color: goal ? goal.color : modalColor
      });
    }
    setModalTitle('');
    setModalDesc('');
    setModalGoalId('');
    setModalColor('#0ea5e9');
    setEditingTaskId(null);
    setShowCreateModal(false);
    refresh();
  };

  const handleAddMemo = () => {
    if (!memoTitle.trim()) return;
    const goal = memoGoalId ? goalMap.get(memoGoalId) : null;
    setMemoItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: memoTitle.trim(), goalId: memoGoalId || null, color: goal ? goal.color : '#0ea5e9' }
    ]);
    setMemoTitle('');
    setMemoGoalId('');
    setShowMemoModal(false);
  };

  const shiftDay = (delta: number) => {
    const next = dayjs(selectedDate).add(delta, 'day').format('YYYY-MM-DD');
    setSelectedDate(next);
  };

  if (memoMode) {
    return (
      <div className="grid" style={{ gap: 16 }}>
        <div className="section-block" style={{ background: '#fdfdfd' }}>
          <div className="section-title" style={{ marginBottom: 8 }}>
            <button className="btn secondary" onClick={() => setMemoMode(false)}>
              ← 返回
            </button>
            <span>Memo</span>
          </div>
          <div className="notebook-list">
            {memoItems.map((item) => (
              <div
                className="notebook-row"
                key={item.id}
                style={{ background: item.color, color: '#fff' }}
              >
                <input type="checkbox" disabled />
                <div className="notebook-text">{item.title}</div>
                <button
                  className="notebook-delete"
                  onClick={() => setMemoItems((prev) => prev.filter((m) => m.id !== item.id))}
                  title="删除"
                  style={{ color: '#ef4444' }}
                >
                  ×
                </button>
              </div>
            ))}
            <div className="notebook-row">
              <input type="checkbox" disabled />
              <button className="btn secondary" style={{ width: '100%' }} onClick={() => setShowMemoModal(true)}>
                添加备忘
              </button>
              <div />
            </div>
          </div>
        </div>

        {showMemoModal && (
          <div className="modal-backdrop" onClick={() => setShowMemoModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="section-title" style={{ marginBottom: 12 }}>
                新建备忘
              </h3>
              <div className="grid" style={{ gap: 10, marginBottom: 12 }}>
                <label className="grid">
                  <span>大目标（可选）</span>
                  <select
                    value={memoGoalId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMemoGoalId(val);
                    }}
                  >
                    <option value="">未选择</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid">
                  <span>名称</span>
                  <input value={memoTitle} onChange={(e) => setMemoTitle(e.target.value)} placeholder="输入备忘名称" />
                </label>
                <label className="grid">
                  <span>颜色</span>
                  <input type="color" value={memoGoalId ? goalMap.get(memoGoalId)?.color ?? '#0ea5e9' : '#0ea5e9'} disabled />
                  <small style={{ color: '#64748b' }}>{memoGoalId ? '继承目标颜色' : '默认颜色'}</small>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn secondary" onClick={() => setShowMemoModal(false)}>
                  取消
                </button>
                <button className="btn" onClick={handleAddMemo}>
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="section-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div className="tab-bar">
          <button className={`tab ${view === 'day' ? 'active' : ''}`} onClick={() => setView('day')}>
            Day
          </button>
          <button className={`tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>
            Week
          </button>
          <button className={`tab ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>
            Month
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn secondary" onClick={() => setMemoMode(true)}>
            memo
          </button>
          {view === 'week' && (
            <div className="chip">
              本周：{dayjs(daysOfWeek[0]).format('MM/DD')} - {dayjs(daysOfWeek[6]).format('MM/DD')}
            </div>
          )}
          {view === 'month' && <div className="chip">{monthLabel(selectedDate)}</div>}
        </div>
      </div>

      {view === 'day' && (
        <div className="section-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn secondary" onClick={() => shiftDay(-1)}>
              ←
            </button>
            {/* <div style={{ fontWeight: 700 }}>{dayjs(selectedDate).format('MM.DD YY')}</div> */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <button className="btn secondary" onClick={() => shiftDay(1)}>
              →
            </button>
          </div>
        </div>
      )}
      {view === 'day' && (
        <div className="section-block" style={{ background: '#fdfdfd' }}>
          <div className="section-title" style={{ marginBottom: 8 }}>
            <span>Today</span>
            <span className="badge">{dayTasks.length} 项</span>
            <button className="btn" onClick={() => setShowCreateModal(true)} style={{ marginLeft: 'auto' }}>
              +
            </button>
          </div>
          <div className="notebook-list">
            {dayTasks
              .slice()
              .sort((a, b) => Number(a.done) - Number(b.done))
              .map((task) => (
                <div
                  className="notebook-row"
                  key={task.id}
                  style={{ background: task.color, color: '#fff' }}
                  onClick={() => {
                    setEditingTaskId(task.id);
                    setModalTitle(task.title);
                    setModalDesc(task.description ?? '');
                    setModalGoalId(task.goalId ?? '');
                    setModalColor(task.color);
                    setShowCreateModal(true);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => handleToggle(task.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className={`notebook-text ${task.done ? 'done' : ''}`}>{task.title}</div>
                  <button
                    className="notebook-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(task.id);
                    }}
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))}
            <div className="notebook-row">
              <input type="checkbox" disabled />
              <input
                className="notebook-input"
                placeholder="添加今天的任务…"
                readOnly
                onClick={() => setShowCreateModal(true)}
                onFocus={() => setShowCreateModal(true)}
              />
              <div />
            </div>
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="grid" style={{ gap: 16 }}>
          <div className="section-block">
            <div className="section-title">
              <span>本周各目标投入次数（已完成任务计数）</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {weeklyStats.length === 0 && <div className="chip">暂无数据</div>}
              {weeklyStats.map((stat) => (
                <div
                  key={stat.goalId ?? 'free'}
                  className="chip"
                  style={{ border: `1px solid ${stat.color}`, color: '#0f172a' }}
                >
                  <span className="goal-dot" style={{ background: stat.color }} />
                  {stat.goalName || goalMap.get(stat.goalId || '')?.name || '自由任务'} · {stat.count}
                </div>
              ))}
            </div>
          </div>

          <div className="section-block" style={{ padding: 10 }}>
            <div className="week-grid-wrapper">
              <div className="week-grid-header">
                {daysOfWeek.map((day, idx) => (
                  <div className="week-grid-headcell" key={day}>
                    <span>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]} {dayjs(day).format('MM/DD')}
                    </span>
                    <span className="badge">{(tasksByDay[day] || []).length}</span>
                  </div>
                ))}
              </div>
              <div className="week-grid-body">
                {daysOfWeek.map((day) => (
                  <div className="week-grid-col" key={day}>
                    <div className="notebook-list">
                      {(tasksByDay[day] || []).map((task) => (
                        <div
                          className="notebook-row"
                          key={task.id}
                          style={{ background: task.color, color: '#fff' }}
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setModalTitle(task.title);
                            setModalDesc(task.description ?? '');
                            setModalGoalId(task.goalId ?? '');
                            setModalColor(task.color);
                            setShowCreateModal(true);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={(e) => handleToggle(task.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className={`notebook-text ${task.done ? 'done' : ''}`}>{task.title}</div>
                          <button
                            className="notebook-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id);
                            }}
                            title="删除"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <div className="notebook-row">
                        <input type="checkbox" disabled />
                        <input
                          className="notebook-input"
                          placeholder="添加今天的任务…"
                          value={weekInputs[day] ?? ''}
                          onChange={(e) => setWeekInputs((prev) => ({ ...prev, [day]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateQuick(weekInputs[day] ?? '', day);
                              setWeekInputs((prev) => ({ ...prev, [day]: '' }));
                            }
                          }}
                        />
                        <div />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'month' && (
        <div className="section-block">
          <div className="section-title">
            <span>月视图</span>
            <span className="badge">MVP 占位</span>
          </div>
          <p style={{ color: '#475569' }}>月视图 MVP：后续可加入日历格或统计，本版暂显示当前月份标记。</p>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="section-title" style={{ marginBottom: 12 }}>
              新建任务
            </h3>
            <div className="grid" style={{ gap: 10, marginBottom: 12 }}>
              <label className="grid">
                <span>大目标（可选）</span>
                <select
                  value={modalGoalId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModalGoalId(val);
                    if (val) {
                      const g = goalMap.get(val);
                      if (g) setModalColor(g.color);
                    }
                  }}
                >
                  <option value="">未选择</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid">
                <span>名称</span>
                <input value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} placeholder="输入任务名称" />
              </label>
              <label className="grid">
                <span>描述</span>
                <textarea
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  placeholder="补充说明（可选）"
                  style={{ minHeight: 80 }}
                />
              </label>
              <label className="grid">
                <span>颜色</span>
                <input
                  type="color"
                  value={modalColor}
                  disabled={!!modalGoalId}
                  onChange={(e) => setModalColor(e.target.value)}
                />
                <small style={{ color: '#64748b' }}>{modalGoalId ? '继承目标颜色' : '自定义颜色'}</small>
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="btn" onClick={handleCreateFromModal}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
