import React, { useEffect, useMemo, useState } from 'react';
import { useServices } from '../state/AppProvider';
import { Goal, Category, Task } from '../../domain/types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  goals: Goal[];
  onCreated?: (task: Task) => void;
}

export function TaskEditorModal({ open, onClose, defaultDate, goals, onCreated }: Props) {
  const services = useServices();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [goalId, setGoalId] = useState<string | ''>('');
  const [categoryId, setCategoryId] = useState<string | ''>('');
  const [color, setColor] = useState('#0ea5e9');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    if (!goalId) {
      setCategories([]);
      return;
    }
    services.categories.listByGoal(goalId).then(setCategories);
  }, [goalId, services.categories]);

  const selectedGoal = useMemo(() => goals.find((g) => g.id === goalId), [goals, goalId]);

  useEffect(() => {
    if (selectedGoal) {
      setColor(selectedGoal.color);
    }
  }, [selectedGoal]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const created = await services.tasks.create({
        title: title.trim(),
        date,
        goalId: goalId || null,
        categoryId: categoryId || null,
        color: selectedGoal ? selectedGoal.color : color
      });
      onCreated?.(created);
      setTitle('');
      setCategoryId('');
      setGoalId('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="section-title">新增任务</h3>
        <div className="grid" style={{ marginBottom: 12 }}>
          <label className="grid">
            <span>标题*</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：背单词 20 分钟" />
          </label>
          <label className="grid">
            <span>日期</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="grid">
            <span>目标（可选）</span>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">自由任务</option>
              {goals.map((g) => (
                <option value={g.id} key={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          {goalId && (
            <label className="grid">
              <span>步骤 / Category（可选）</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">未选择</option>
                {categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid">
            <span>颜色</span>
            <input type="color" value={selectedGoal ? selectedGoal.color : color} onChange={(e) => setColor(e.target.value)} disabled={!!selectedGoal} />
            <small style={{ color: '#64748b' }}>{selectedGoal ? '继承目标色' : '自定义自由任务颜色'}</small>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn secondary" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button className="btn" onClick={handleSubmit} disabled={loading}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
