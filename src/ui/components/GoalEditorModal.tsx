import React, { useEffect, useMemo, useState } from 'react';
import { Goal } from '../../domain/types';
import { useServices } from '../state/AppProvider';
import { todayISO } from '../../utils/date';

interface Props {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
  onSaved?: (goal: Goal) => void;
}

const PLANET_PRESETS = [
  { name: 'Neptune', color: '#5a6dff' },
  { name: 'Mars', color: '#d28a65' },
  { name: 'Gaia', color: '#78bf8f' },
  { name: 'Zenith', color: '#8a86d0' }
];

function findPresetByColor(color?: string | null) {
  if (!color) return PLANET_PRESETS[0];
  return PLANET_PRESETS.find((preset) => preset.color.toLowerCase() === color.toLowerCase()) ?? PLANET_PRESETS[0];
}

export function GoalEditorModal({ open, onClose, goal, onSaved }: Props) {
  const services = useServices();
  const [name, setName] = useState(goal?.name ?? '');
  const [type, setType] = useState<Goal['type']>(goal?.type ?? 'ongoing');
  const [startDate, setStartDate] = useState(goal?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(goal?.endDate ?? '');
  const [importance, setImportance] = useState(goal?.importance ?? 3);
  const [selectedPlanet, setSelectedPlanet] = useState(findPresetByColor(goal?.color));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setType(goal.type);
      setStartDate(goal.startDate);
      setEndDate(goal.endDate ?? '');
      setImportance(goal.importance);
      setSelectedPlanet(findPresetByColor(goal.color));
    } else {
      setName('');
      setType('ongoing');
      setStartDate(todayISO());
      setEndDate('');
      setImportance(3);
      setSelectedPlanet(PLANET_PRESETS[0]);
    }
  }, [goal]);

  const color = useMemo(() => selectedPlanet.color, [selectedPlanet]);

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
    <div className="goal-sheet-backdrop" onClick={onClose}>
      <div className="goal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="goal-sheet__header">
          <button className="goal-sheet__close" onClick={onClose} disabled={loading} aria-label="Close">
            ×
          </button>
          <button className="goal-sheet__done" onClick={handleSubmit} disabled={loading}>
            Done
          </button>
        </div>

        <div className="goal-sheet__content">
          <label className="goal-sheet__field">
            <span>Goal Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Design Voyager Module"
            />
          </label>

          <div className="goal-sheet__field">
            <span>Planet</span>
            <div className="goal-sheet__planets">
              {PLANET_PRESETS.map((planet) => {
                const active = planet.name === selectedPlanet.name;
                return (
                  <button
                    key={planet.name}
                    type="button"
                    className={`goal-planet-chip ${active ? 'is-active' : ''}`}
                    onClick={() => setSelectedPlanet(planet)}
                  >
                    <span className="goal-planet-chip__planet" style={{ '--planet-color': planet.color } as React.CSSProperties} />
                    <span className="goal-planet-chip__label">{planet.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="goal-sheet__field">
            <span>Goal Type</span>
            <div className="goal-type-switch">
              <button
                type="button"
                className={type === 'ongoing' ? 'is-active' : ''}
                onClick={() => setType('ongoing')}
              >
                Continuous
              </button>
              <button
                type="button"
                className={type === 'project' ? 'is-active' : ''}
                onClick={() => setType('project')}
              >
                Project-based
              </button>
            </div>
          </div>

          <div className="goal-sheet__field">
            <span>Timeline</span>
            <div className="goal-sheet__dates">
              <label className="goal-date-card">
                <small>Start Date</small>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label className="goal-date-card">
                <small>End Date</small>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={type !== 'project'}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
