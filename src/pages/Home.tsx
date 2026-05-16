import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicle } from '../context/VehicleContext';
import { useLang } from '../context/LanguageContext';
import { MODELS, getYearsForModel } from '../data/vehicles';
import { ModelId } from '../types';
import './Home.css';

export default function Home() {
  const { setVehicle } = useVehicle();
  const { t, tf } = useLang();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const years = selectedModel ? getYearsForModel(selectedModel) : [];
  const model = selectedModel ? MODELS.find(m => m.id === selectedModel) : null;

  const handleModelSelect = (id: ModelId) => {
    setSelectedModel(id);
    setSelectedYear(null);
  };

  const handleFindParts = () => {
    if (!selectedModel || !selectedYear) return;
    setVehicle({ modelId: selectedModel, year: selectedYear });
    navigate('/catalog');
  };

  const findBtnLabel = selectedModel && selectedYear
    ? tf('home_find_selected', { name: model?.name ?? '', year: selectedYear })
    : t('home_find_default');

  return (
    <main className="home-page">
      <div className="home-bg" />

      <div className="home-inner">
        <div className="home-brand">
          <span className="home-logo-t">T</span>Hub<span className="home-logo-ge">.ge</span>
        </div>
        <p className="home-tagline">{t('home_tagline')}</p>

        <div className="selector-card">
          <h1 className="selector-title">{t('home_select_title')}</h1>
          <p className="selector-sub">{t('home_select_sub')}</p>

          <div className="model-grid">
            {MODELS.map(m => (
              <button
                key={m.id}
                className={`model-card ${selectedModel === m.id ? 'model-card-active' : ''}`}
                style={selectedModel === m.id
                  ? { borderColor: m.color, '--model-color': m.color } as React.CSSProperties
                  : {}}
                onClick={() => handleModelSelect(m.id as ModelId)}
              >
                <div
                  className="model-silhouette"
                  style={{ color: selectedModel === m.id ? m.color : undefined }}
                >
                  {(m.id === 'M3' || m.id === 'MS') && <SilhouetteSedan tall={m.id === 'MS'} />}
                  {(m.id === 'MY' || m.id === 'MX') && <SilhouetteSUV tall={m.id === 'MX'} />}
                </div>
                <span className="model-name">{m.name}</span>
                <span className="model-years">{m.years.from}–{m.years.to}</span>
                {selectedModel === m.id && (
                  <span className="model-check" style={{ background: m.color }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {selectedModel && (
            <div className="year-section">
              <p className="year-label">{t('home_year_label')} — {model?.fullName}</p>
              <div className="year-grid">
                {years.map(y => (
                  <button
                    key={y}
                    className={`year-btn ${selectedYear === y ? 'year-btn-active' : ''}`}
                    style={selectedYear === y
                      ? { background: model?.color, borderColor: model?.color } as React.CSSProperties
                      : {}}
                    onClick={() => setSelectedYear(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="find-parts-btn"
            disabled={!selectedModel || !selectedYear}
            onClick={handleFindParts}
            style={
              selectedModel && selectedYear && model
                ? { background: model.color } as React.CSSProperties
                : {}
            }
          >
            {findBtnLabel}
          </button>
        </div>

        <div className="home-trust">
          <span>✅ {t('home_trust_oem')}</span>
          <span>·</span>
          <span>🚀 {t('home_trust_delivery')}</span>
          <span>·</span>
          <span>📞 {t('home_trust_support')}</span>
          <span>·</span>
          <span>↩️ {t('home_trust_returns')}</span>
        </div>
      </div>
    </main>
  );
}

function SilhouetteSedan({ tall }: { tall?: boolean }) {
  return (
    <svg viewBox="0 0 120 52" fill="currentColor" aria-hidden="true" className="silhouette">
      <path d={tall
        ? 'M8 34 C8 34 18 18 35 16 L52 13 L68 13 L85 16 C102 18 112 34 112 34 L112 38 L100 38 C100 35 97 32 93 32 C89 32 86 35 86 38 L34 38 C34 35 31 32 27 32 C23 32 20 35 20 38 L8 38 Z'
        : 'M8 36 C8 36 20 22 36 20 L50 16 L70 16 L84 20 C100 22 112 36 112 36 L112 39 L100 39 C100 36 97 33 93 33 C89 33 86 36 86 39 L34 39 C34 36 31 33 27 33 C23 33 20 36 20 39 L8 39 Z'}
      />
      <circle cx="27" cy="39" r="6" />
      <circle cx="93" cy="39" r="6" />
      <circle cx="27" cy="39" r="2.5" fill="var(--bg2)" />
      <circle cx="93" cy="39" r="2.5" fill="var(--bg2)" />
    </svg>
  );
}

function SilhouetteSUV({ tall }: { tall?: boolean }) {
  return (
    <svg viewBox="0 0 120 52" fill="currentColor" aria-hidden="true" className="silhouette">
      <path d={tall
        ? 'M8 34 C8 34 15 14 30 12 L45 10 L75 10 L90 12 C105 14 112 34 112 34 L112 38 L100 38 C100 35 97 32 93 32 C89 32 86 35 86 38 L34 38 C34 35 31 32 27 32 C23 32 20 35 20 38 L8 38 Z'
        : 'M8 35 C8 35 16 16 30 14 L44 11 L76 11 L90 14 C104 16 112 35 112 35 L112 39 L100 39 C100 36 97 33 93 33 C89 33 86 36 86 39 L34 39 C34 36 31 33 27 33 C23 33 20 36 20 39 L8 39 Z'}
      />
      <circle cx="27" cy="39" r="6" />
      <circle cx="93" cy="39" r="6" />
      <circle cx="27" cy="39" r="2.5" fill="var(--bg2)" />
      <circle cx="93" cy="39" r="2.5" fill="var(--bg2)" />
    </svg>
  );
}
