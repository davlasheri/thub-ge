export interface Generation {
  id: string;
  label: string;
  from: number;
  to: number;
  note?: string;
}

/** Raw generation definition (no display label — the label is derived from the model name). */
export interface GenerationDef {
  id: string;
  from: number;
  to: number;
  note?: string;
}

const DEFAULTS: Record<string, GenerationDef[]> = {
  MS: [
    { id: 'ms-g1', from: 2012, to: 2015 },
    { id: 'ms-g2', from: 2016, to: 2020 },
    { id: 'ms-g3', from: 2021, to: 2024 },
  ],
  M3: [
    { id: 'm3-g1', from: 2017, to: 2020 },
    { id: 'm3-g2', from: 2021, to: 2022 },
    { id: 'm3-g3', from: 2023, to: 2024, note: 'Highland' },
  ],
  MX: [
    { id: 'mx-g1', from: 2015, to: 2020 },
    { id: 'mx-g2', from: 2021, to: 2024 },
  ],
  MY: [
    { id: 'my-g1', from: 2020, to: 2022 },
    { id: 'my-g2', from: 2023, to: 2024 },
  ],
};

/** Built-in defaults for a model, or a single full-range generation if the model has none. */
export function defaultGenerationDefs(modelId: string, yearFrom: number, yearTo: number): GenerationDef[] {
  return DEFAULTS[modelId] ?? [{ id: `${modelId}-all`, from: yearFrom, to: yearTo }];
}

/** Human-readable label, e.g. "Model 3  2023 – 2024  (Highland)". */
export function genLabel(modelName: string, g: { from: number; to: number; note?: string }): string {
  return `${modelName}  ${g.from} – ${g.to}${g.note ? `  (${g.note})` : ''}`;
}

/** Turn raw defs into display generations for a given model name. */
export function buildGenerations(modelName: string, defs: GenerationDef[]): Generation[] {
  return defs.map(d => ({ id: d.id, from: d.from, to: d.to, note: d.note, label: genLabel(modelName, d) }));
}

/** Backward-compatible helper (defaults only). Prefer the GenerationsContext for editable data. */
export function getGenerations(modelId: string, yearFrom: number, yearTo: number): Generation[] {
  return buildGenerations(modelId, defaultGenerationDefs(modelId, yearFrom, yearTo));
}
