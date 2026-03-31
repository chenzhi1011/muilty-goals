import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Goal, Category } from '../../domain/types';
import { useServices } from '../state/AppProvider';
import { GoalEditorModal } from '../components/GoalEditorModal';
import { formatDate } from '../../utils/date';

type Props = {
  onNavigateTasks?: () => void;
};

type GoalsView = 'planets' | 'galaxy';
type GalaxyGoalStatus = 'planet' | 'pending';
type GalaxyArchiveMap = Record<string, { status: GalaxyGoalStatus }>;

const FLOAT_OFFSETS = [
  { x: 0, y: 0 },
  { x: 12, y: 10 },
  { x: -10, y: 6 },
  { x: 8, y: -8 }
];

const GALAXY_ARCHIVE_KEY = 'goal_galaxy_archive';

export default function GoalsPage({ onNavigateTasks }: Props) {
  const services = useServices();
  const longPressTimerRef = useRef<number | null>(null);
  const longPressGoalIdRef = useRef<string | null>(null);
  const [view, setView] = useState<GoalsView>('planets');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Record<string, Category[]>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);
  const [completionRate, setCompletionRate] = useState(0);
  const [arrangingGoalId, setArrangingGoalId] = useState<string | null>(null);
  const [galaxyArchive, setGalaxyArchive] = useState<GalaxyArchiveMap>({});

  const detailGoal = useMemo(
    () => (detailGoalId ? goals.find((goal) => goal.id === detailGoalId) ?? null : null),
    [detailGoalId, goals]
  );
  const arrangingGoal = useMemo(
    () => (arrangingGoalId ? goals.find((goal) => goal.id === arrangingGoalId) ?? null : null),
    [arrangingGoalId, goals]
  );
  const archivedGoals = useMemo(
    () => goals.filter((goal) => galaxyArchive[goal.id]),
    [galaxyArchive, goals]
  );
  const activePlanets = useMemo(
    () => goals.filter((goal) => !galaxyArchive[goal.id]),
    [galaxyArchive, goals]
  );

  useEffect(() => {
    void refreshGoals();
    void refreshCompletion();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(GALAXY_ARCHIVE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as GalaxyArchiveMap;
      if (parsed && typeof parsed === 'object') {
        setGalaxyArchive(parsed);
      }
    } catch {
      // ignore malformed persisted state
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GALAXY_ARCHIVE_KEY, JSON.stringify(galaxyArchive));
  }, [galaxyArchive]);

  async function refreshGoals() {
    const list = await services.goals.listActive();
    setGoals(list);
    list.forEach((goal) => {
      void loadCategories(goal.id);
    });
  }

  async function refreshCompletion() {
    const list = await services.tasks.listByRange('0000-01-01', '9999-12-31');
    if (list.length === 0) {
      setCompletionRate(0);
      return;
    }
    const doneCount = list.filter((task) => task.done).length;
    setCompletionRate(Math.round((doneCount / list.length) * 100));
  }

  async function loadCategories(goalId: string) {
    const list = await services.categories.listByGoal(goalId);
    setCategories((prev) => ({ ...prev, [goalId]: list }));
  }

  async function handleAddCategory(goalId: string) {
    const name = categoryInputs[goalId];
    if (!name?.trim()) return;
    await services.categories.create({ goalId, name: name.trim() });
    setCategoryInputs((prev) => ({ ...prev, [goalId]: '' }));
    await loadCategories(goalId);
  }

  async function handleRemoveCategory(goalId: string, categoryId: string) {
    await services.categories.delete(categoryId);
    await loadCategories(goalId);
  }

  async function handleRenameCategory(goalId: string, categoryId: string, current: string) {
    const name = window.prompt('修改类别名称', current);
    if (!name?.trim()) return;
    await services.categories.update({ id: categoryId, name: name.trim() });
    await loadCategories(goalId);
  }

  async function handleDeleteGoal(goalId: string) {
    const ok = window.confirm('删除后关联任务将转为未分组任务，确认删除？');
    if (!ok) return;
    await services.goals.delete(goalId);
    setGalaxyArchive((prev) => {
      const next = { ...prev };
      delete next[goalId];
      return next;
    });
    setDetailGoalId(null);
    await refreshGoals();
  }

  function archiveGoal(goalId: string, status: GalaxyGoalStatus) {
    setGalaxyArchive((prev) => ({ ...prev, [goalId]: { status } }));
    setArrangingGoalId(null);
  }

  function openCreateGoal() {
    setEditingGoal(null);
    setShowModal(true);
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setShowModal(true);
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function startPlanetLongPress(goalId: string) {
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressGoalIdRef.current = goalId;
      setArrangingGoalId(goalId);
    }, 420);
  }

  function finishPlanetPress() {
    clearLongPressTimer();
  }

  function handlePlanetClick(goal: Goal) {
    if (longPressGoalIdRef.current === goal.id) {
      longPressGoalIdRef.current = null;
      return;
    }
    openEditGoal(goal);
  }

  return (
    <>
      <div className="goals-screen">
        <div className="goals-phone">
          <div className="goals-stars" aria-hidden="true">
            <span className="goals-star goals-star-a" />
            <span className="goals-star goals-star-b" />
            <span className="goals-star goals-star-c" />
            <span className="goals-star goals-star-d" />
            <span className="goals-star goals-star-e" />
            <span className="goals-star goals-star-f" />
            <span className="goals-star goals-star-g" />
            <span className="goals-star goals-star-h" />
          </div>

          {view === 'planets' ? (
            <>
              <div className="goals-orbit-field">
                {activePlanets.length === 0 ? (
                  <div className="goals-empty-state">
                    <p>No planets yet</p>
                    <button type="button" onClick={openCreateGoal}>
                      Create first goal
                    </button>
                  </div>
                ) : (
                  activePlanets.map((goal, index) => {
                    const offset = FLOAT_OFFSETS[index % FLOAT_OFFSETS.length];
                    return (
                      <button
                        key={goal.id}
                        className="goal-planet"
                        style={
                          {
                            '--float-x': `${offset.x}px`,
                            '--float-y': `${offset.y}px`,
                            '--planet-color': goal.color,
                            animationDelay: `${index * 0.4}s`
                          } as React.CSSProperties
                        }
                        onPointerDown={() => startPlanetLongPress(goal.id)}
                        onPointerUp={finishPlanetPress}
                        onPointerLeave={finishPlanetPress}
                        onPointerCancel={finishPlanetPress}
                        onClick={() => handlePlanetClick(goal)}
                        type="button"
                      >
                        <span className="goal-planet__name">{goal.name}</span>
                        <span className="goal-planet__meta">
                          {goal.type === 'ongoing' ? 'Ongoing' : 'Project'} · {goal.importance}★
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                className="goals-galaxy-button"
                onClick={() => setView('galaxy')}
                aria-label="Open galaxy view"
              >
                <span className="goals-galaxy-button__core" />
                <span className="goals-galaxy-button__ring" />
                <span className="goals-galaxy-button__dot" />
              </button>

              <section className="goals-panel goals-panel--raised">
                <div className="goals-stat-card">
                  <small>Active Goals</small>
                  <strong>{activePlanets.length}</strong>
                </div>

                <div className="goals-panel-copy">
                  <h1>My goals</h1>
                  <button type="button" className="goals-create-button" onClick={openCreateGoal}>
                    Create
                  </button>
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="galaxy-header">
                <button
                  type="button"
                  className="galaxy-back-button"
                  onClick={() => setView('planets')}
                  aria-label="Back to planets"
                >
                  ←
                </button>
                <h1>My galaxy</h1>
              </div>

              <div className="galaxy-period">2024-2025</div>

              <div className="galaxy-grid">
                {archivedGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    className={`galaxy-card ${galaxyArchive[goal.id]?.status === 'pending' ? 'is-muted' : ''}`}
                    onClick={() => setDetailGoalId(goal.id)}
                    style={{ '--planet-color': goal.color } as React.CSSProperties}
                  >
                    <span className="galaxy-card__planet">
                      <span className="galaxy-card__core" />
                      <span className="galaxy-card__ring" />
                    </span>
                    <span className="galaxy-card__label">{goal.name}</span>
                  </button>
                ))}
              </div>

              <section className="goals-panel goals-panel--galaxy">
                <div className="goals-stat-card">
                  <small>Archived Goals</small>
                  <strong>{archivedGoals.length}</strong>
                </div>

                <div className="goals-completion-card">
                  <small>Completion</small>
                  <div className="goals-completion-card__value">
                    <strong>{completionRate}</strong>
                    <span>%</span>
                  </div>
                </div>
              </section>
            </>
          )}

          <nav className="goals-bottom-nav" aria-label="Primary">
            <button type="button" onClick={onNavigateTasks}>
              Done
            </button>
            <button type="button" className="is-active">
              Planets
            </button>
          </nav>
        </div>
      </div>

      <GoalEditorModal
        open={showModal}
        goal={editingGoal}
        onClose={() => {
          setShowModal(false);
          setEditingGoal(null);
        }}
        onSaved={() => void refreshGoals()}
      />

      {arrangingGoal && (
        <div className="goal-arrange-backdrop" onClick={() => setArrangingGoalId(null)}>
          <div className="goal-arrange-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="goal-arrange-sheet__planet" style={{ '--planet-color': arrangingGoal.color } as React.CSSProperties} />
            <div className="goal-arrange-sheet__title">{arrangingGoal.name}</div>
            <button
              type="button"
              className="goal-arrange-sheet__action is-primary"
              onClick={() => archiveGoal(arrangingGoal.id, 'planet')}
            >
              Make planet
            </button>
            <button
              type="button"
              className="goal-arrange-sheet__action is-secondary"
              onClick={() => archiveGoal(arrangingGoal.id, 'pending')}
            >
              Pending
            </button>
            <button
              type="button"
              className="goal-arrange-sheet__close"
              onClick={() => setArrangingGoalId(null)}
            >
              close
            </button>
          </div>
        </div>
      )}

      {detailGoal && (
        <div className="modal-backdrop" onClick={() => setDetailGoalId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 92vw)' }}>
            <div className="section-title" style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="goal-dot"
                  style={{
                    width: 14,
                    height: 14,
                    background: detailGoal.color,
                    boxShadow: `0 0 0 6px ${detailGoal.color}22`
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800 }}>{detailGoal.name}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>
                    {detailGoal.type === 'ongoing' ? '持续型' : '项目型'} · 重要度 {detailGoal.importance}
                  </div>
                </div>
              </div>
              <button className="btn secondary" onClick={() => setDetailGoalId(null)}>
                关闭
              </button>
            </div>

            <div style={{ color: '#475569', fontSize: 14 }}>
              {detailGoal.type === 'ongoing' ? (
                <>开始：{formatDate(detailGoal.startDate, 'YYYY/MM/DD')}</>
              ) : (
                <>
                  {formatDate(detailGoal.startDate, 'YYYY/MM/DD')} -{' '}
                  {detailGoal.endDate ? formatDate(detailGoal.endDate, 'YYYY/MM/DD') : '未设置'}
                </>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>类别 / 步骤</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {(categories[detailGoal.id] || []).map((category) => (
                  <div
                    key={category.id}
                    className="chip"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>{category.name}</span>
                    <button
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#0ea5e9' }}
                      onClick={() => handleRenameCategory(detailGoal.id, category.id, category.name)}
                      title="重命名"
                    >
                      ✎
                    </button>
                    <button
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                      onClick={() => handleRemoveCategory(detailGoal.id, category.id)}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {(categories[detailGoal.id] || []).length === 0 && (
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>还没有子目标，快速添加一个</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={categoryInputs[detailGoal.id] ?? ''}
                onChange={(e) =>
                  setCategoryInputs((prev) => ({ ...prev, [detailGoal.id]: e.target.value }))
                }
                placeholder="新增类别 / 步骤"
              />
              <button className="btn secondary" onClick={() => void handleAddCategory(detailGoal.id)}>
                添加
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                className="btn secondary"
                onClick={() => {
                  setEditingGoal(detailGoal);
                  setShowModal(true);
                  setDetailGoalId(null);
                }}
              >
                编辑目标
              </button>

              <button
                className="btn"
                style={{ background: '#ef4444' }}
                onClick={() => void handleDeleteGoal(detailGoal.id)}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
