import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCars } from '../context/CarsContext';
import { useLang } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { CarListing } from '../types';
import { TranslationKey } from '../data/translations';
import './Cars.css';
import { usePageMeta } from '../utils/seo';

type TFn = (k: TranslationKey) => string;

function conditionColor(c: CarListing['condition']) {
  return c === 'excellent' ? '#27ae60' : c === 'good' ? '#f39c12' : '#888';
}

function CarCard({ car, t, phone, waNumber }: { car: CarListing; t: TFn; phone: string; waNumber: string }) {
  const photo = car.photos[0] || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=70';
  const condKey = `condition_${car.condition}` as TranslationKey;
  const waText = encodeURIComponent(
    `Hi THub.ge! I'm interested in your ${car.year} Tesla ${car.model} (${car.price.toLocaleString()} ₾, ${car.mileage.toLocaleString()} km). Can you send more details?`
  );

  return (
    <div className={`car-card ${!car.available ? 'car-card-sold' : ''}`}>
      <div className="car-card-photo">
        <img src={photo} alt={`${car.year} Tesla ${car.model}`} loading="lazy" />
        {!car.available && <div className="car-sold-overlay">{t('cars_sold')}</div>}
      </div>
      <div className="car-card-body">
        <div className="car-card-title-row">
          <h3 className="car-card-name">{car.year} Tesla {car.model}</h3>
          <span className="car-condition-dot" style={{ background: conditionColor(car.condition) }} title={t(condKey)} />
        </div>
        <div className="car-card-price">{car.price.toLocaleString()} ₾</div>
        <div className="car-card-specs">
          <span>⚡ {car.batteryRange} {t('cars_km')}</span>
          <span>🛣 {car.mileage.toLocaleString()} {t('cars_km')}</span>
        </div>
        <div className="car-card-colors">
          <span>{car.exteriorColor}</span>
          <span className="car-color-sep">·</span>
          <span>{car.interiorColor}</span>
        </div>
        <div className="car-card-tags">
          <span className="car-tag" style={{ background: conditionColor(car.condition) + '22', color: conditionColor(car.condition) }}>{t(condKey)}</span>
          {car.autopilot && <span className="car-tag car-tag-gray">Autopilot</span>}
          {car.fsd && <span className="car-tag car-tag-gray">FSD</span>}
        </div>
        <div className="car-card-actions">
          {car.available && (
            <>
              <a href={`tel:${phone}`} className="car-btn car-btn-call">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {t('cars_call')}
              </a>
              <a href={`https://wa.me/${waNumber}?text=${waText}`} target="_blank" rel="noreferrer" className="car-btn car-btn-wa">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.827L.057 23.944l6.263-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.007-1.373l-.36-.213-3.716.855.884-3.615-.234-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/>
                </svg>
                WhatsApp
              </a>
            </>
          )}
          <Link to={`/cars/${car.id}`} className="car-btn car-btn-details">{t('cars_view')} →</Link>
        </div>
      </div>
    </div>
  );
}

export default function Cars() {
  usePageMeta('Tesla ავტომობილები იყიდება', 'შეარჩიეთ Tesla Model S, 3, X ან Y საქართველოში — შემოწმებული ავტომობილები THub.ge-სგან.');
  const { cars } = useCars();
  const { t } = useLang();
  const { settings } = useSiteSettings();
  const [filter, setFilter] = useState('all');

  const phone = settings.contact.phoneHref || 'tel:+995599286244';
  const waNumber = '995599286244';

  const displayed = filter === 'all' ? cars : cars.filter(c => c.model === filter);
  const presentModels = [...new Set(cars.map(c => c.model))];

  return (
    <div className="cars-page">
      <div className="cars-hero">
        <div className="container">
          <p className="cars-hero-label">⚡ Tesla</p>
          <h1 className="cars-hero-title">{t('cars_title')}</h1>
          <p className="cars-hero-sub">{t('cars_sub')}</p>
        </div>
      </div>

      <div className="container cars-content">
        {cars.length > 0 && (
          <div className="cars-filters">
            <button
              className={`cars-filter-btn ${filter === 'all' ? 'cars-filter-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('cars_all')} ({cars.length})
            </button>
            {presentModels.map(model => (
              <button
                key={model}
                className={`cars-filter-btn ${filter === model ? 'cars-filter-active' : ''}`}
                onClick={() => setFilter(model)}
              >
                {model} ({cars.filter(c => c.model === model).length})
              </button>
            ))}
          </div>
        )}

        {displayed.length === 0 ? (
          <div className="cars-empty">
            <div className="cars-empty-icon">🚗</div>
            <h2>{t('cars_empty')}</h2>
            <p>{t('cars_empty_sub')}</p>
          </div>
        ) : (
          <div className="cars-grid">
            {displayed.map(car => (
              <CarCard key={car.id} car={car} t={t} phone={phone} waNumber={waNumber} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
