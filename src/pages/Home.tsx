import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useModels } from '../context/ModelsContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { usePageMeta } from '../utils/seo';
import TeslaModelHero from '../components/TeslaModelHero';
import './Home.css';

const ORDER = ['MS', 'M3', 'MX', 'MY'];

export default function Home() {
  usePageMeta('Tesla-ს ნაწილები საქართველოში', 'ორიგინალი და ანალოგი Tesla ნაწილები Model S, 3, X, Y-სთვის. სერვისი, ავტომობილები, მიწოდება მთელ საქართველოში.');
  const { t, lang } = useLang();
  const { models } = useModels();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  // model tabs in the canonical S / 3 / X / Y order, admin models appended
  const ordered = [
    ...ORDER.map(id => models.find(m => m.id === id)).filter(Boolean),
    ...models.filter(m => !ORDER.includes(m.id)),
  ] as typeof models;

  const [modelId, setModelId] = useState(ordered[0]?.id ?? 'M3');
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);
  const activeModel = ordered.find(m => m.id === modelId);

  const adminTagline = lang === 'ka' ? settings.home.taglineKa
    : lang === 'ru' ? settings.home.taglineRu
    : settings.home.taglineEn;
  const tagline = adminTagline.trim() || t('home_tagline');

  const banner = lang === 'ka' ? settings.home.bannerKa
    : lang === 'ru' ? settings.home.bannerRu
    : settings.home.bannerEn;

  const openSection = (sectionId: string) => navigate(`/catalog?model=${modelId}&sec=${sectionId}`);

  return (
    <main className="home2">
      <section className="home2-hero">
        <div className="home2-grid-bg" />
        <div className="home2-glow" />

        <div className="container home2-hero-inner">
          <h1 className="home2-title">
            ყველა ნაწილი. <span className="home2-title-red">ერთი ადგილი.</span>
          </h1>
          <p className="home2-sub">{tagline}</p>

          {/* model switcher */}
          <div className="home2-models" role="tablist">
            {ordered.map(m => (
              <button
                key={m.id}
                role="tab"
                aria-selected={modelId === m.id}
                className={`home2-model-tab ${modelId === m.id ? 'home2-model-tab-on' : ''}`}
                style={modelId === m.id ? { borderColor: m.color, color: m.color } : undefined}
                onClick={() => { setModelId(m.id); setZoneLabel(null); }}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* the blueprint transforms to the chosen model */}
          <div className="home2-car">
            <TeslaModelHero modelId={modelId} onZoneClick={openSection} onZoneHover={setZoneLabel} />
            <div className={`home2-zone-label ${zoneLabel ? 'home2-zone-label-on' : ''}`}>
              {zoneLabel
                ? `${zoneLabel} — ${activeModel?.name ?? ''}`
                : `შეეხეთ ნაწილს — გაიხსნება ${activeModel?.name ?? ''}-ის კატალოგი`}
            </div>
          </div>

          <div className="home2-ctas">
            <Link to="/catalog" className="btn-primary home2-cta-main">{t('nav_catalogue')} →</Link>
            <Link to="/cars" className="home2-cta-ghost">{t('nav_cars')}</Link>
            <Link to="/service" className="home2-cta-ghost">{t('nav_service')}</Link>
          </div>

          {banner.trim() && <div className="home2-banner">{banner}</div>}
        </div>
      </section>
    </main>
  );
}
