import { createContext, useContext, useState, useMemo } from 'react';
import { TeslaModel } from '../types';
import { MODELS as HARDCODED } from '../data/vehicles';

const MODELS_KEY  = 'thub_admin_models';
const DELETED_KEY = 'thub_deleted_models';

interface ModelsCtx {
  models: TeslaModel[];
  isAdminModel: (id: string) => boolean;
  addModel: (m: TeslaModel) => void;
  updateModel: (m: TeslaModel) => void;
  deleteModel: (id: string) => void;
  getYearsForModel: (modelId: string) => number[];
}

const Ctx = createContext<ModelsCtx | null>(null);

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [adminModels, setAdminModels] = useState<TeslaModel[]>(() => {
    try { return JSON.parse(localStorage.getItem(MODELS_KEY) ?? '[]'); }
    catch { return []; }
  });
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]')); }
    catch { return new Set(); }
  });

  const persistModels = (ms: TeslaModel[]) => {
    setAdminModels(ms);
    localStorage.setItem(MODELS_KEY, JSON.stringify(ms));
  };
  const persistDeleted = (ids: Set<string>) => {
    setDeletedIds(ids);
    localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
  };

  const models = useMemo(() => {
    const adminIds = new Set(adminModels.map(m => m.id));
    return [
      ...HARDCODED.filter(m => !adminIds.has(m.id) && !deletedIds.has(m.id)),
      ...adminModels.filter(m => !deletedIds.has(m.id)),
    ];
  }, [adminModels, deletedIds]);

  const isAdminModel = (id: string) => adminModels.some(m => m.id === id);

  const addModel = (m: TeslaModel) => persistModels([...adminModels, m]);

  const updateModel = (m: TeslaModel) => {
    const exists = adminModels.some(x => x.id === m.id);
    persistModels(exists
      ? adminModels.map(x => x.id === m.id ? m : x)
      : [...adminModels, m]);
  };

  const deleteModel = (id: string) => {
    persistModels(adminModels.filter(m => m.id !== id));
    persistDeleted(new Set([...deletedIds, id]));
  };

  const getYearsForModel = (modelId: string): number[] => {
    const m = models.find(x => x.id === modelId);
    if (!m) return [];
    const ys: number[] = [];
    for (let y = m.years.to; y >= m.years.from; y--) ys.push(y);
    return ys;
  };

  return (
    <Ctx.Provider value={{ models, isAdminModel, addModel, updateModel, deleteModel, getYearsForModel }}>
      {children}
    </Ctx.Provider>
  );
}

export function useModels() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useModels outside ModelsProvider');
  return ctx;
}
