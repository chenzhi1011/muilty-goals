import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Goal, Task } from '../../domain/types';
import { useServices } from '../state/AppProvider';
import { computeWeeklyStats } from '../../domain/stats';
import { getWeekDays, monthLabel, todayISO } from '../../utils/date';
import { weekRange } from '../../usecases/tasks';

type ViewMode = 'day' | 'week' | 'month';

export default function TasksPage() {
  // 服务接口
  const services = useServices();
  // 视图切换与输入状态
  const [view, setView] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  // 数据状态
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  // 快捷输入状态
  const [dayInput, setDayInput] = useState('');
  const [weekInputs, setWeekInputs] = useState<Record<string, string>>({});
  // 任务弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalGoalId, setModalGoalId] = useState<string | ''>(''); // 任务目标选择
  const [modalColor, setModalColor] = useState('#0ea5e9');
  // Memo 模式与数据
  const [memoMode, setMemoMode] = useState(false);
  const [memoItems, setMemoItems] = useState<{ id: string; title: string; goalId?: string | null; color: string }[]>([]);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoTitle, setMemoTitle] = useState('');
  const [memoGoalId, setMemoGoalId] = useState<string | ''>('');

  // 目标映射便于取名/颜色
  const goalMap = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);

  // 本地备忘存储 key
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

  // 首次无任务时注入演示数据
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

  // 仅展示昨/今/明三天
  const daysOfWeek = useMemo(
    () => [
      dayjs(selectedDate).add(-1, 'day').format('YYYY-MM-DD'),
      dayjs(selectedDate).format('YYYY-MM-DD'),
      dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD')
    ],
    [selectedDate]
  );
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

  // 新建/编辑任务提交
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

  // 新建备忘提交
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

  // 日期快捷切换（上下日）
  const shiftDay = (delta: number) => {
    const next = dayjs(selectedDate).add(delta, 'day').format('YYYY-MM-DD');
    setSelectedDate(next);
  };
  //把阿拉伯数字转化成文字
  function numberToChineseMonth(n: number) {
  const cn = ['零','一','二','三','四','五','六','七','八','九'];
  if (n <= 10) return (n === 10 ? '十' : cn[n]) + '月';
  if (n < 20) return '十' + cn[n - 10] + '月';
  return cn[Math.floor(n / 10)] + '十' + cn[n % 10] + '月';
}
  // Memo 模式下的独立视图
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

  // 默认任务视图
  // 默认任务视图
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
            <div
              className="section-title"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
            >
              <button className="btn secondary" onClick={() => shiftDay(-1)}>
                ←
              </button>
              <span style={{ margin: '0', fontSize: 18, flex: 1, textAlign: 'center' }}>
                {numberToChineseMonth(dayjs().month() + 1)}
              </span>
              <button className="btn secondary" onClick={() => shiftDay(1)}>
                →
              </button>
            </div>
          </div>
          
          {/* TODO 周视图优化 */}
          <div className="section-block" style={{ padding: 10 }}>
            <div className="week-grid-wrapper">
              <div className="week-grid-header">
                {daysOfWeek.map((day, idx) => (
                  <div className="week-grid-headcell" key={day}>
                    <span style={{alignSelf: "center"}}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]} 
                    </span>
                    <div
                      style={{ alignSelf: 'center'}}
                      className={
                        dayjs(day).isSame(dayjs(), 'day') ? 'today-dot' : undefined
                      }
                    >
                      {dayjs(day).format('DD')}
                    </div>
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
      
      {/* TODO 月视图 */}
      {view === 'month' && (
        <div className="section-block">
          <div className="section-title">
            <span>月视图</span>
            <span className="badge">MVP 占位</span>
          </div>
          <p style={{ color: '#475569' }}>月视图 MVP</p>
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
