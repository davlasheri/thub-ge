import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VehicleSelection } from '../types';
import { MODELS } from '../data/vehicles';

interface VehicleContextType {
  vehicle: VehicleSelection | null;
  setVehicle: (v: VehicleSelection | null) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

const STORAGE_KEY = 'thub_vehicle';

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicle, setVehicleState] = useState<VehicleSelection | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setVehicle = (v: VehicleSelection | null) => {
    setVehicleState(v);
    if (v) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (vehicle) {
      const model = MODELS.find(m => m.id === vehicle.modelId);
      if (!model || vehicle.year < model.years.from || vehicle.year > model.years.to) {
        setVehicle(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VehicleContext.Provider value={{ vehicle, setVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicle must be used within VehicleProvider');
  return ctx;
}
