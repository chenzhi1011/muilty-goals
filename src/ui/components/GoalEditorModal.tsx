import React, { useEffect, useState } from 'react';
import { Goal } from '../../domain/types';
import { useServices } from '../state/AppProvider';
import { todayISO } from '../../utils/date';

interface Props {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
  onSaved?: (goal: Goal) => void;
}

export function GoalEditorModal({ open, onClose, goal, onSaved }: Props) {
  const services = useServices();
  const [name, setName] = useState(goal?.name ?? '');
  const [type, setType] = useState<Goal['type']>(goal?.type ?? 'ongoing');
  const [startDate, setStartDate] = useState(goal?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(goal?.endDate ?? '');
  const [importance, setImportance] = useState(goal?.importance ?? 3);
  const [color, setColor] = useState(goal?.color ?? '#0ea5e9');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setType(goal.type);
      setStartDate(goal.startDate);
      setEndDate(goal.endDate ?? '');
      setImportance(goal.importance);
      setColor(goal.color);
    } else {
      setName('');
      setType('ongoing');
      setStartDate(todayISO());
      setEndDate('');
      setImportance(3);
      setColor('#0ea5e9');
    }
  }, [goal]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (goal) {
        const updated = await services.goals.update({
          id: goal.id,
          name: name.trim(),
          type,
          startDate,
          endDate: type === 'project' ? endDate || null : null,
          importance,
          color
        });
        onSaved?.(updated);
      } else {
        const created = await services.goals.create({
          name: name.trim(),
          type,
          startDate,
          endDate: type === 'project' ? endDate || null : null,
          importance,
          color
        });
        onSaved?.(created);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="section-title">{goal ? '编辑目标' : '新增目标'}</h3>
        <div className="grid" style={{ marginBottom: 12 }}>
          <label className="grid">
            <span>名称*</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：提升日语" />
          </label>
          <label className="grid">
            <span>类型*</span>
            <select value={type} onChange={(e) => setType(e.target.value as Goal['type'])}>
              <option value="ongoing">持续型</option>
              <option value="project">项目型</option>
            </select>
          </label>
          <label className="grid">
            <span>开始日期*</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          {type === 'project' && (
            <label className="grid">
              <span>结束日期</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          )}
          <label className="grid">
            <span>重要度 (1-5)</span>
            <input
              type="number"
              min={1}
              max={5}
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value))}
            />
          </label>
          <label className="grid">
            <span>颜色</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
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
