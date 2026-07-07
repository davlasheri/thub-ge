import { createContext, useContext, useState, ReactNode } from 'react';
import { CarListing } from '../types';
import { syncContent } from '../utils/contentSync';

const CARS_KEY = 'thub_cars';

const SEED_CARS: CarListing[] = [
  {
    id: 'seed_ms_2022',
    model: 'Model S', year: 2022, price: 129000, mileage: 28400,
    exteriorColor: 'Solid Black', interiorColor: 'Black',
    condition: 'excellent', batteryRange: 637,
    autopilot: true, fsd: true,
    description: 'Pristine Model S Plaid in Solid Black. Full Self-Driving purchased, all software up to date. Single owner, no accidents, always garaged. Includes premium interior, 21" Arachnid wheels.',
    photos: [
      'https://images.unsplash.com/photo-1676856577533-1e8099932f7b?w=1200&q=80',
      'https://images.unsplash.com/photo-1617704548623-340376564e68?w=1200&q=80',
    ],
    available: true,
  },
  {
    id: 'seed_m3_2023',
    model: 'Model 3', year: 2023, price: 68500, mileage: 11200,
    exteriorColor: 'Pearl White', interiorColor: 'White',
    condition: 'excellent', batteryRange: 576,
    autopilot: true, fsd: false,
    description: 'Like-new Model 3 Long Range AWD. Delivered October 2023. White exterior with all-white interior upgrade. Heat pump, 18" Aero wheels. One careful owner.',
    photos: [
      'https://images.unsplash.com/photo-1638398417409-dd54452eccdf?w=1200&q=80',
    ],
    available: true,
  },
  {
    id: 'seed_my_2021',
    model: 'Model Y', year: 2021, price: 72000, mileage: 44700,
    exteriorColor: 'Solid Black', interiorColor: 'Black',
    condition: 'good', batteryRange: 505,
    autopilot: true, fsd: false,
    description: 'Well-maintained Model Y Long Range AWD. Seven-seat configuration. Regular service history. Minor paint scuff on rear bumper (reflected in price). Winter tires included.',
    photos: [
      'https://images.unsplash.com/photo-1676754568744-7852efc67c40?w=1200&q=80',
    ],
    available: true,
  },
  {
    id: 'seed_mx_2020',
    model: 'Model X', year: 2020, price: 95000, mileage: 62000,
    exteriorColor: 'Solid Black', interiorColor: 'Cream',
    condition: 'good', batteryRange: 507,
    autopilot: true, fsd: false,
    description: 'Spacious Model X Long Range with signature falcon-wing doors. 6-seat layout with cream interior. Tow hitch installed. All-weather mats. Two sets of wheels (summer + all-season).',
    photos: [
      'https://images.unsplash.com/photo-1707002752329-5a4a889f7de9?w=1200&q=80',
    ],
    available: true,
  },
  {
    id: 'seed_m3_2019',
    model: 'Model 3', year: 2019, price: 44000, mileage: 88500,
    exteriorColor: 'Red Multi-Coat', interiorColor: 'Black',
    condition: 'good', batteryRange: 490,
    autopilot: true, fsd: false,
    description: 'Reliable Model 3 Standard Range Plus in eye-catching red. Autopilot with Navigate on Autopilot. Battery health 94%. Ideal second car or daily driver.',
    photos: [
      'https://images.unsplash.com/photo-1573794607350-eea0ba7cc94a?w=1200&q=80',
    ],
    available: false,
  },
];

function readStored(): CarListing[] {
  try {
    const stored = localStorage.getItem(CARS_KEY);
    if (!stored) return SEED_CARS;
    const parsed: CarListing[] = JSON.parse(stored);
    if (parsed.length === 0) return SEED_CARS;
    return parsed;
  } catch { return SEED_CARS; }
}

interface CarsContextType {
  cars: CarListing[];
  addCar: (c: CarListing) => void;
  updateCar: (c: CarListing) => void;
  deleteCar: (id: string) => void;
  getById: (id: string) => CarListing | undefined;
}

const CarsContext = createContext<CarsContextType | undefined>(undefined);

export function CarsProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<CarListing[]>(readStored);

  const persist = (list: CarListing[]) => {
    syncContent(CARS_KEY, JSON.stringify(list));
    setCars(list);
  };

  return (
    <CarsContext.Provider value={{
      cars,
      addCar:    (c) => persist([...cars, c]),
      updateCar: (c) => persist(cars.map(x => x.id === c.id ? c : x)),
      deleteCar: (id) => persist(cars.filter(x => x.id !== id)),
      getById:   (id) => cars.find(x => x.id === id),
    }}>
      {children}
    </CarsContext.Provider>
  );
}

export function useCars() {
  const ctx = useContext(CarsContext);
  if (!ctx) throw new Error('useCars must be used within CarsProvider');
  return ctx;
}
