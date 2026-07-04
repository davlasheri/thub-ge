import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCars } from '../context/CarsContext';
import { useLang } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { TranslationKey } from '../data/translations';
import { CarListing } from '../types';
import { usePageMeta } from '../utils/seo';
import './CarDetail.css';

type TFn = (k: TranslationKey) => string;

function conditionColor(c: CarListing['condition']) {
  return c === 'excellent' ? '#27ae60' : c === 'good' ? '#f39c12' : '#888';
}

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const { getById } = useCars();
  const { t } = useLang();
  const { settings } = useSiteSettings();
  const [photoIdx, setPhotoIdx] = useState(0);

  const car = id ? getById(id) : undefined;
  usePageMeta(car ? `Tesla ${car.model} ${car.year} იყიდება` : 'ავტომობილი', car?.description);

  if (!car) {
    return (
      <div className="car-detail-notfound">
        <h2>Car not found</h2>
        <Link to="/cars" className="btn-primary">{t('cars_back')}</Link>
      </div>
    );
  }

  const photos = car.photos.length ? car.photos : ['https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=70'];
  const condKey = `condition_${car.condition}` as TranslationKey;
  const phone = settings.contact.phone || '+995 599 286 244';
  const phoneHref = settings.contact.phoneHref || 'tel:+995599286244';
  const waNumber = '995599286244';
  const waText = encodeURIComponent(
    `Hi THub.ge! I'm interested in your ${car.year} Tesla ${car.model} (${car.price.toLocaleString()} ₾, ${car.mileage.toLocaleString()} km). Can you send more details?`
  );

  const SpecRow = ({ label, value }: { label: string; value: string }) => (
    <div className="car-spec-row">
      <span className="car-spec-label">{label}</span>
      <span className="car-spec-value">{value}</span>
    </div>
  );

  return (
    <div className="car-detail-page">
      <div className="container car-detail-container">
        <Link to="/cars" className="car-detail-back">{t('cars_back')}</Link>

        <div className="car-detail-grid">
          {/* Gallery */}
          <div className="car-gallery">
            <div className="car-gallery-main">
              <img src={photos[photoIdx]} alt={`${car.year} Tesla ${car.model}`} />
              {!car.available && <div className="car-gallery-sold">{t('cars_sold')}</div>}
            </div>
            {photos.length > 1 && (
              <div className="car-gallery-thumbs">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    className={`car-thumb ${i === photoIdx ? 'car-thumb-active' : ''}`}
                    onClick={() => setPhotoIdx(i)}
                  >
                    <img src={p} alt={`Photo ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="car-info">
            <div className="car-info-header">
              <h1 className="car-info-title">{car.year} Tesla {car.model}</h1>
              <span
                className="car-info-condition"
                style={{ background: conditionColor(car.condition) + '22', color: conditionColor(car.condition) }}
              >
                {t(condKey)}
              </span>
            </div>
            <div className="car-info-price">{car.price.toLocaleString()} ₾</div>

            <div className="car-specs-card">
              <h3 className="car-specs-title">{t('cars_specs')}</h3>
              <SpecRow label={t('cars_year')} value={String(car.year)} />
              <SpecRow label={t('cars_mileage')} value={`${car.mileage.toLocaleString()} ${t('cars_km')}`} />
              <SpecRow label={t('cars_range')} value={`${car.batteryRange} ${t('cars_km')}`} />
              <SpecRow label={t('cars_exterior')} value={car.exteriorColor} />
              <SpecRow label={t('cars_interior')} value={car.interiorColor} />
              <SpecRow label={t('cars_autopilot')} value={car.autopilot ? t('cars_yes') : t('cars_no')} />
              <SpecRow label={t('cars_fsd')} value={car.fsd ? t('cars_yes') : t('cars_no')} />
            </div>

            {car.description && (
              <div className="car-description">
                <h3 className="car-specs-title">{t('cars_desc')}</h3>
                <p>{car.description}</p>
              </div>
            )}

            {car.available && (
              <div className="car-contact-box">
                <h3>{t('cars_contact_title')}</h3>
                <p>{t('cars_contact_sub')}</p>
                <div className="car-contact-btns">
                  <a href={phoneHref} className="car-contact-btn car-contact-call">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {phone}
                  </a>
                  <a href={`https://wa.me/${waNumber}?text=${waText}`} target="_blank" rel="noreferrer" className="car-contact-btn car-contact-wa">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.827L.057 23.944l6.263-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.007-1.373l-.36-.213-3.716.855.884-3.615-.234-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/>
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
