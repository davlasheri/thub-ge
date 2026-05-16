import { TeslaModel } from '../types';

export const MODELS: TeslaModel[] = [
  {
    id: 'M3',
    name: 'Model 3',
    fullName: 'Tesla Model 3',
    years: { from: 2017, to: 2024 },
    color: '#e31937',
  },
  {
    id: 'MY',
    name: 'Model Y',
    fullName: 'Tesla Model Y',
    years: { from: 2020, to: 2024 },
    color: '#5c6bc0',
  },
  {
    id: 'MS',
    name: 'Model S',
    fullName: 'Tesla Model S',
    years: { from: 2012, to: 2024 },
    color: '#26a69a',
  },
  {
    id: 'MX',
    name: 'Model X',
    fullName: 'Tesla Model X',
    years: { from: 2015, to: 2024 },
    color: '#8d6e63',
  },
];

export function getModelById(id: string) {
  return MODELS.find(m => m.id === id);
}

export function getYearsForModel(modelId: string): number[] {
  const model = getModelById(modelId);
  if (!model) return [];
  const years: number[] = [];
  for (let y = model.years.to; y >= model.years.from; y--) {
    years.push(y);
  }
  return years;
}
