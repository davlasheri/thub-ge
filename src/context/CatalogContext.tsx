import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { CATALOG as HARDCODED } from '../data/catalog';
import { CatalogSection, CatalogSubsection } from '../types';
import { syncContent } from '../utils/contentSync';

const SECTIONS_KEY = 'thub_admin_catalog';
const DELETED_KEY  = 'thub_deleted_sections';

function readStored(): CatalogSection[] {
  try { return JSON.parse(localStorage.getItem(SECTIONS_KEY) ?? '[]'); }
  catch { return []; }
}
function readDeleted(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]')); }
  catch { return new Set(); }
}

interface CatalogContextType {
  catalog: CatalogSection[];
  isAdminSection: (id: string) => boolean;
  addSection:       (s: CatalogSection) => void;
  updateSection:    (s: CatalogSection) => void;
  deleteSection:    (id: string) => void;
  addSubsection:    (sectionId: string, sub: CatalogSubsection) => void;
  updateSubsection: (sectionId: string, sub: CatalogSubsection) => void;
  deleteSubsection: (sectionId: string, subId: string) => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [adminSections, setAdminSections] = useState<CatalogSection[]>(readStored);
  const [deletedIds,    setDeletedIds]    = useState<Set<string>>(readDeleted);

  const catalog = useMemo(() => {
    const adminIds = new Set(adminSections.map(s => s.id));
    return [
      ...HARDCODED.filter(s => !adminIds.has(s.id) && !deletedIds.has(s.id)),
      ...adminSections.filter(s => !deletedIds.has(s.id)),
    ];
  }, [adminSections, deletedIds]);

  const persistSections = (list: CatalogSection[]) => {
    syncContent(SECTIONS_KEY, JSON.stringify(list));
    setAdminSections(list);
  };
  const persistDeleted = (set: Set<string>) => {
    syncContent(DELETED_KEY, JSON.stringify([...set]));
    setDeletedIds(set);
  };

  // When editing a hardcoded section, save as override with same id
  const upsertSection = (s: CatalogSection) => {
    const exists = adminSections.some(x => x.id === s.id);
    persistSections(exists ? adminSections.map(x => x.id === s.id ? s : x) : [...adminSections, s]);
  };

  const addSection    = (s: CatalogSection) => persistSections([...adminSections, s]);
  const updateSection = (s: CatalogSection) => upsertSection(s);
  const deleteSection = (id: string) => {
    persistSections(adminSections.filter(s => s.id !== id));
    persistDeleted(new Set([...deletedIds, id]));
  };

  const withSection = (sectionId: string, fn: (s: CatalogSection) => CatalogSection) => {
    const section = catalog.find(s => s.id === sectionId);
    if (section) upsertSection(fn(section));
  };

  const addSubsection    = (sid: string, sub: CatalogSubsection) =>
    withSection(sid, s => ({ ...s, subsections: [...s.subsections, sub] }));

  const updateSubsection = (sid: string, sub: CatalogSubsection) =>
    withSection(sid, s => ({ ...s, subsections: s.subsections.map(x => x.id === sub.id ? sub : x) }));

  const deleteSubsection = (sid: string, subId: string) =>
    withSection(sid, s => ({ ...s, subsections: s.subsections.filter(x => x.id !== subId) }));

  const isAdminSection = (id: string) => adminSections.some(s => s.id === id);

  return (
    <CatalogContext.Provider value={{
      catalog, isAdminSection,
      addSection, updateSection, deleteSection,
      addSubsection, updateSubsection, deleteSubsection,
    }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
