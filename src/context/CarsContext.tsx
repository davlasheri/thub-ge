import { createContext, useContext, useState, ReactNode } from 'react';
import { CarListing } from '../types';

const CARS_KEY = 'thub_cars';

function readStored(): CarListing[] {
  try { return JSON.parse(localStorage.getItem(CARS_KEY) ?? '[]'); }
  catch { return []; }
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
    localStorage.setItem(CARS_KEY, JSON.stringify(list));
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
