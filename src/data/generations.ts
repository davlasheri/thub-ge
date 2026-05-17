export interface Generation {
  id: string;
  label: string;
  from: number;
  to: number;
}

const PREDEFINED: Record<string, Generation[]> = {
  MS: [
    { id: 'ms-g1', label: 'Model S  2012 – 2015', from: 2012, to: 2015 },
    { id: 'ms-g2', label: 'Model S  2016 – 2020', from: 2016, to: 2020 },
    { id: 'ms-g3', label: 'Model S  2021 – 2024', from: 2021, to: 2024 },
  ],
  M3: [
    { id: 'm3-g1', label: 'Model 3  2017 – 2020', from: 2017, to: 2020 },
    { id: 'm3-g2', label: 'Model 3  2021 – 2022', from: 2021, to: 2022 },
    { id: 'm3-g3', label: 'Model 3  2023 – 2024  (Highland)', from: 2023, to: 2024 },
  ],
  MX: [
    { id: 'mx-g1', label: 'Model X  2015 – 2020', from: 2015, to: 2020 },
    { id: 'mx-g2', label: 'Model X  2021 – 2024', from: 2021, to: 2024 },
  ],
  MY: [
    { id: 'my-g1', label: 'Model Y  2020 – 2022', from: 2020, to: 2022 },
    { id: 'my-g2', label: 'Model Y  2023 – 2024', from: 2023, to: 2024 },
  ],
};

export function getGenerations(modelId: string, yearFrom: number, yearTo: number): Generation[] {
  return PREDEFINED[modelId] ?? [
    { id: `${modelId}-all`, label: `${yearFrom} – ${yearTo}`, from: yearFrom, to: yearTo },
  ];
}
