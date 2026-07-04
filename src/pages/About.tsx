import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import './About.css';
import { usePageMeta } from '../utils/seo';

export default function About() {
  usePageMeta('ჩვენ შესახებ', 'THub.ge — Tesla-ს ნაწილებისა და სერვისის ცენტრი საქართველოში 2019 წლიდან.');
  const { t } = useLang();

  return (
    <main className="about-page">
      <div className="container">
        <div className="about-hero">
          <span className="about-badge">{t('about_badge')}</span>
          <h1>{t('about_title').split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}</h1>
          <p>{t('about_intro')}</p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <span className="about-icon">🎯</span>
            <h3>{t('about_mission_title')}</h3>
            <p>{t('about_mission_text')}</p>
          </div>
          <div className="about-card">
            <span className="about-icon">🏆</span>
            <h3>{t('about_why_title')}</h3>
            <p>{t('about_why_text')}</p>
          </div>
          <div className="about-card">
            <span className="about-icon">🚀</span>
            <h3>{t('about_delivery_title')}</h3>
            <p>{t('about_delivery_text')}</p>
          </div>
        </div>

        <div className="about-stats-row">
          <div className="about-stat">
            <span className="about-stat-num">2019</span>
            <span className="about-stat-label">{t('about_founded')}</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">5,400+</span>
            <span className="about-stat-label">{t('about_customers')}</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">2,000+</span>
            <span className="about-stat-label">{t('about_products')}</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">4.9★</span>
            <span className="about-stat-label">{t('about_rating')}</span>
          </div>
        </div>

        <div className="about-cta">
          <h2>{t('about_cta_title')}</h2>
          <p>{t('about_cta_sub')}</p>
          <Link to="/products" className="btn-primary about-cta-btn">{t('about_cta_btn')}</Link>
        </div>
      </div>
    </main>
  );
}
