import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { TranslationKey } from '../data/translations';
import './Service.css';

type TFn = (k: TranslationKey) => string;

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    titleKey: 'service_feat1_title' as TranslationKey,
    textKey: 'service_feat1_text' as TranslationKey,
    accent: true,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
        <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z"/>
      </svg>
    ),
    titleKey: 'service_feat2_title' as TranslationKey,
    textKey: 'service_feat2_text' as TranslationKey,
    accent: false,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
      </svg>
    ),
    titleKey: 'service_feat3_title' as TranslationKey,
    textKey: 'service_feat3_text' as TranslationKey,
    accent: false,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3"/>
      </svg>
    ),
    titleKey: 'service_feat4_title' as TranslationKey,
    textKey: 'service_feat4_text' as TranslationKey,
    accent: false,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
      </svg>
    ),
    titleKey: 'service_feat5_title' as TranslationKey,
    textKey: 'service_feat5_text' as TranslationKey,
    accent: false,
  },
];

function FeatureCard({ icon, titleKey, textKey, accent, t }: {
  icon: React.ReactNode; titleKey: TranslationKey; textKey: TranslationKey; accent: boolean; t: TFn;
}) {
  return (
    <div className={`svc-card ${accent ? 'svc-card-accent' : ''}`}>
      <div className="svc-card-icon">{icon}</div>
      <h3 className="svc-card-title">{t(titleKey)}</h3>
      <p className="svc-card-text">{t(textKey)}</p>
    </div>
  );
}

export default function Service() {
  const { t } = useLang();
  const { settings } = useSiteSettings();
  const phone = settings.contact.phone || '+995 599 286 244';
  const phoneHref = settings.contact.phoneHref || 'tel:+995599286244';
  const waNumber = '995599286244';
  const waText = encodeURIComponent('Hi THub.ge! I\'d like to book a Tesla service appointment.');

  const [titleLine1, titleLine2] = t('service_title').split('\n');

  const steps = [
    { num: t('service_step1_num'), title: t('service_step1_title'), text: t('service_step1_text') },
    { num: t('service_step2_num'), title: t('service_step2_title'), text: t('service_step2_text') },
    { num: t('service_step3_num'), title: t('service_step3_title'), text: t('service_step3_text') },
  ];

  return (
    <main className="svc-page">

      {/* ── Hero ── */}
      <div className="svc-hero">
        <div className="container">
          <span className="svc-badge">{t('service_badge')}</span>
          <h1 className="svc-hero-title">
            {titleLine1}<br />
            <span className="svc-hero-title-red">{titleLine2}</span>
          </h1>
          <p className="svc-hero-sub">{t('service_sub')}</p>
          <div className="svc-hero-btns">
            <a href={phoneHref} className="svc-hero-btn svc-hero-btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {phone}
            </a>
            <a href={`https://wa.me/${waNumber}?text=${waText}`} target="_blank" rel="noreferrer" className="svc-hero-btn svc-hero-btn-wa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.827L.057 23.944l6.263-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.007-1.373l-.36-.213-3.716.855.884-3.615-.234-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div className="container svc-features-section">
        <div className="svc-features-grid">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} t={t} />
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="svc-how-section">
        <div className="container">
          <h2 className="svc-how-title">{t('service_how_title')}</h2>
          <div className="svc-steps">
            {steps.map((s, i) => (
              <div key={i} className="svc-step">
                <div className="svc-step-num">{s.num}</div>
                <div className="svc-step-connector" />
                <h3 className="svc-step-title">{s.title}</h3>
                <p className="svc-step-text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="container svc-cta-section">
        <div className="svc-cta-box">
          <div className="svc-cta-content">
            <h2 className="svc-cta-title">{t('service_cta_title')}</h2>
            <p className="svc-cta-sub">{t('service_cta_sub')}</p>
          </div>
          <Link to="/contact" className="btn-primary svc-cta-btn">{t('service_cta_btn')}</Link>
        </div>
      </div>

    </main>
  );
}
