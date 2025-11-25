import React, { PropsWithChildren, useMemo } from 'react';
import { createRepositories } from '../../adapters/storage';
import { createUsecases, Usecases } from '../../usecases';

const ServicesContext = React.createContext<Usecases | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const services = useMemo(() => {
    const repos = createRepositories();
    return createUsecases(repos);
  }, []);

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  const ctx = React.useContext(ServicesContext);
  if (!ctx) throw new Error('Services not ready');
  return ctx;
}
