import { createContext, useContext, useState, ReactNode } from 'react';
import { Generation, GenerationDef, defaultGenerationDefs, buildGenerations } from '../data/generations';

const KEY = 'thub_admin_generations';

interface GenerationsCtx {
  /** Effective raw defs for a model (admin override if present, else built-in defaults). */
  getDefs: (modelId: string, yearFrom: number, yearTo: number) => GenerationDef[];
  /** Display generations (labelled) for the catalogue. */
  getGenerations: (modelId: string, modelName: string, yearFrom: number, yearTo: number) => Generation[];
  /** Whether the model's generations have been customised in the admin. */
  isCustom: (modelId: string) => boolean;
  saveDefs: (modelId: string, defs: GenerationDef[]) => void;
  resetDefs: (modelId: string) => void;
}

const Ctx = createContext<GenerationsCtx | null>(null);

export function GenerationsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, GenerationDef[]>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); }
    catch { return {}; }
  });

  const persist = (o: Record<string, GenerationDef[]>) => {
    setOverrides(o);
    localStorage.setItem(KEY, JSON.stringify(o));
  };

  const getDefs = (modelId: string, yearFrom: number, yearTo: number): GenerationDef[] =>
    overrides[modelId] ?? defaultGenerationDefs(modelId, yearFrom, yearTo);

  const getGenerations = (modelId: string, modelName: string, yearFrom: number, yearTo: number): Generation[] =>
    buildGenerations(modelName, getDefs(modelId, yearFrom, yearTo));

  const isCustom = (modelId: string) => !!overrides[modelId];

  const saveDefs = (modelId: string, defs: GenerationDef[]) =>
    persist({ ...overrides, [modelId]: defs });

  const resetDefs = (modelId: string) => {
    const o = { ...overrides };
    delete o[modelId];
    persist(o);
  };

  return (
    <Ctx.Provider value={{ getDefs, getGenerations, isCustom, saveDefs, resetDefs }}>
      {children}
    </Ctx.Provider>
  );
}

export function useGenerations() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGenerations must be used within GenerationsProvider');
  return ctx;
}
