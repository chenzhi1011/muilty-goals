import React, { useState } from 'react';
import TasksPage from './ui/pages/TasksPage';
import GoalsPage from './ui/pages/GoalsPage';

type Page = 'tasks' | 'goals';

export default function App() {
  const [page, setPage] = useState<Page>('tasks');

  return (
    <>
      <div className="app-shell">
        <header className="content-header">
          {/* 品牌与标题 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0ea5e9, #22d3ee)',
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                fontWeight: 900,
                letterSpacing: -0.5
              }}
            >
              G
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>GoalFlow</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>多目标 · 多任务 · 离线可用</div>
            </div>
          </div>
        </header>
        {page === 'tasks' ? <TasksPage /> : <GoalsPage />}
      </div>
      <nav className="bottom-nav" role="navigation" aria-label="Primary">
        <button className={page === 'tasks' ? 'active' : ''} onClick={() => setPage('tasks')}>
          <span>Tasks</span>
        </button>
        <button className={page === 'goals' ? 'active' : ''} onClick={() => setPage('goals')}>
          <span>Goals</span>
        </button>
      </nav>
    </>
  );
}
