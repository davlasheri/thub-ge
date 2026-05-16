import { useNavigate } from 'react-router-dom';
import { useVehicle } from '../context/VehicleContext';
import { useLang } from '../context/LanguageContext';
import { MODELS } from '../data/vehicles';
import './VehicleBar.css';

export default function VehicleBar() {
  const { vehicle, setVehicle } = useVehicle();
  const { t } = useLang();
  const navigate = useNavigate();

  if (!vehicle) return null;

  const model = MODELS.find(m => m.id === vehicle.modelId);

  const handleChange = () => {
    setVehicle(null);
    navigate('/');
  };

  return (
    <div className="vehicle-bar" style={{ '--bar-color': model?.color } as React.CSSProperties}>
      <div className="container vehicle-bar-inner">
        <div className="vehicle-bar-left">
          <span className="vehicle-bar-dot" style={{ background: model?.color }} />
          <span className="vehicle-bar-label">{t('vbar_browsing')}</span>
          <span className="vehicle-bar-name">{model?.fullName} · {vehicle.year}</span>
        </div>
        <button className="vehicle-bar-change" onClick={handleChange}>
          {t('vbar_change')}
        </button>
      </div>
    </div>
  );
}
