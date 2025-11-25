import React, { useEffect, useState } from 'react';
import { Goal, Category } from '../../domain/types';
import { useServices } from '../state/AppProvider';
import { GoalEditorModal } from '../components/GoalEditorModal';
import { formatDate } from '../../utils/date';

export default function GoalsPage() {
  const services = useServices();
  // 基础状态
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Record<string, Category[]>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);

  const refreshGoals = async () => {
    const list = await services.goals.listActive();
    setGoals(list);
    list.forEach((g: Goal) => loadCategories(g.id));
  };

  const handleRemoveCategory = async (goalId: string, categoryId: string) => {
    await services.categories.delete(categoryId);
    loadCategories(goalId);
  };

  const handleRenameCategory = async (goalId: string, categoryId: string, current: string) => {
    const name = window.prompt('修改类别名称', current);
    if (!name || !name.trim()) return;
    await services.categories.update({ id: categoryId, name: name.trim() });
    loadCategories(goalId);
  };

  const loadCategories = async (goalId: string) => {
    const list = await services.categories.listByGoal(goalId);
    setCategories((prev) => ({ ...prev, [goalId]: list }));
  };

  useEffect(() => {
    refreshGoals();
  }, []);

  const handleAddCategory = async (goalId: string) => {
    const name = categoryInputs[goalId];
    if (!name || !name.trim()) return;
    await services.categories.create({ goalId, name: name.trim() });
    setCategoryInputs((prev) => ({ ...prev, [goalId]: '' }));
    loadCategories(goalId);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const ok = window.confirm('删除后关联任务将转为未分组任务，确认删除？');
    if (!ok) return;
    await services.goals.delete(goalId);
    setDetailGoalId(null);
    refreshGoals();
  };

  const detailGoal = detailGoalId ? goals.find((g) => g.id === detailGoalId) ?? null : null;

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800 }}>目标设定</div>
          <div style={{ color: '#64748b' }}>悬浮球展示目标，点击查看详情和编辑</div>
        </div>
        <button className="btn" onClick={() => setShowModal(true)} disabled={goals.length >= 3}>
          + 新增目标
        </button>
      </div>

      {goals.length === 0 && <div className="card">暂无目标，先创建一个吧。</div>}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => setDetailGoalId(goal.id)}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: goal.color,
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: 14,
                textAlign: 'center',
                padding: 12
              }}
            >
              {goal.name}
            </div>
            <div className="chip">
              {goal.type === 'ongoing' ? '持续型' : '项目型'} · {goal.importance}★
            </div>
          </button>
        ))}
      </div>

      <GoalEditorModal
        open={showModal}
        goal={editingGoal}
        onClose={() => {
          setShowModal(false);
          setEditingGoal(null);
        }}
        onSaved={() => refreshGoals()}
      />

      {detailGoal && (
        <div className="modal-backdrop" onClick={() => setDetailGoalId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 92vw)' }}>
            <div className="section-title" style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="goal-dot"
                  style={{ width: 14, height: 14, background: detailGoal.color, boxShadow: `0 0 0 6px ${detailGoal.color}22` }}
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
                {(categories[detailGoal.id] || []).map((c) => (
                  <div key={c.id} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span>{c.name}</span>
                    <button
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#0ea5e9' }}
                      onClick={() => handleRenameCategory(detailGoal.id, c.id, c.name)}
                      title="重命名"
                    >
                      ✎
                    </button>
                    <button
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                      onClick={() => handleRemoveCategory(detailGoal.id, c.id)}
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
                onChange={(e) => setCategoryInputs((prev) => ({ ...prev, [detailGoal.id]: e.target.value }))}
                placeholder="新增类别 / 步骤"
              />
              <button className="btn secondary" onClick={() => handleAddCategory(detailGoal.id)}>
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
              <button className="btn" style={{ background: '#ef4444' }} onClick={() => handleDeleteGoal(detailGoal.id)}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
