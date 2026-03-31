import React, { useState } from 'react';
import TasksPage from './ui/pages/TasksPage';
import GoalsPage from './ui/pages/GoalsPage';

type Page = 'tasks' | 'goals';

export default function App() {
  const [page, setPage] = useState<Page>('tasks');

  return (
    page === 'tasks' ? (
      <TasksPage onNavigateGoals={() => setPage('goals')} />
    ) : (
      <GoalsPage onNavigateTasks={() => setPage('tasks')} />
    )
  );
}
