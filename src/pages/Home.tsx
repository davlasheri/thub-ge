import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { usePageMeta } from '../utils/seo';
import TeslaExploded from '../components/TeslaExploded';
import './Home.css';

export default function Home() {
  usePageMeta('Tesla-ს ნაწილები საქართველოში', 'ორიგინალი და ანალოგი Tesla ნაწილები Model S, 3, X, Y-სთვის. სერვისი, ავტომობილები, მიწოდება მთელ საქართველოში.');
  const { t, lang } = useLang();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);

  const adminTagline = lang === 'ka' ? settings.home.taglineKa
    : lang === 'ru' ? settings.home.taglineRu
    : settings.home.taglineEn;
  const tagline = adminTagline.trim() || t('home_tagline');

  const banner = lang === 'ka' ? settings.home.bannerKa
    : lang === 'ru' ? settings.home.bannerRu
    : settings.home.bannerEn;

  const openSection = (sectionId: string) => navigate(`/catalog?sec=${sectionId}`);

  return (
    <main className="home2">

      {/* Hero: the car assembles from its parts */}
      <section className="home2-hero">
        <div className="home2-grid-bg" />
        <div className="home2-glow" />

        <div className="container home2-hero-inner">
          <h1 className="home2-title">
            ყველა ნაწილი. <span className="home2-title-red">ერთი ადგილი.</span>
          </h1>
          <p className="home2-sub">{tagline}</p>

          <div className="home2-car">
            <TeslaExploded onZoneClick={openSection} onZoneHover={setZoneLabel} />
            <div className={`home2-zone-label ${zoneLabel ? 'home2-zone-label-on' : ''}`}>
              {zoneLabel ?? 'შეეხეთ ნაწილს ავტომობილზე — გაიხსნება კატალოგი'}
            </div>
          </div>

          <div className="home2-ctas">
            <Link to="/catalog" className="btn-primary home2-cta-main">{t('nav_catalogue')} →</Link>
            <Link to="/cars" className="home2-cta-ghost">{t('nav_cars')}</Link>
            <Link to="/service" className="home2-cta-ghost">{t('nav_service')}</Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="home2-stats">
        <div className="container home2-stats-inner">
          <div className="home2-stat"><strong>2019</strong><span>დაარსდა</span></div>
          <div className="home2-stat"><strong>5,400+</strong><span>კმაყოფილი მომხმარებელი</span></div>
          <div className="home2-stat"><strong>2,000+</strong><span>პროდუქტი</span></div>
          <div className="home2-stat"><strong>4.9★</strong><span>საშუალო შეფასება</span></div>
        </div>
      </section>

      {banner.trim() && (
        <div className="container">
          <div className="home2-banner">{banner}</div>
        </div>
      )}

      {/* Trust row */}
      <div className="container home2-trust">
        <span>✅ {t('home_trust_oem')}</span>
        <span>·</span>
        <span>🚀 {t('home_trust_delivery')}</span>
        <span>·</span>
        <span>📞 {t('home_trust_support')}</span>
        <span>·</span>
        <span>↩️ {t('home_trust_returns')}</span>
      </div>
    </main>
  );
}
