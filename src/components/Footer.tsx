import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { APP_VERSION, CHANGELOG } from '../data/changelog';
import './Footer.css';

export default function Footer() {
  const { t } = useLang();
  const [versionsOpen, setVersionsOpen] = useState(false);

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="logo-t">T</span>Hub<span className="logo-ge">.ge</span>
          </Link>
          <p className="footer-tagline">{t('footer_tagline')}<br />{t('footer_delivery')}</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>{t('footer_shop')}</h4>
            <Link to="/catalog">{t('nav_catalogue')}</Link>
            <Link to="/cars">{t('nav_cars')}</Link>
            <Link to="/service">{t('nav_service')}</Link>
          </div>
          <div className="footer-col">
            <h4>{t('footer_company')}</h4>
            <Link to="/about">{t('footer_about')}</Link>
            <Link to="/contact">{t('footer_contact')}</Link>
            <a href="#">{t('footer_shipping')}</a>
            <a href="#">{t('footer_returns')}</a>
          </div>
          <div className="footer-col">
            <h4>{t('footer_support')}</h4>
            <a href="tel:+995599286244">+995 599 286 244</a>
            <a href="mailto:info@thub.ge">info@thub.ge</a>
            <p className="footer-address">Tbilisi, Georgia</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} THub.ge — {t('footer_rights')}</p>

          <div className="footer-version-wrap">
            {versionsOpen && (
              <div className="footer-versions" onMouseLeave={() => setVersionsOpen(false)}>
                <p className="footer-versions-title">ვერსიების ისტორია</p>
                <div className="footer-versions-list">
                  {CHANGELOG.map((entry, i) => (
                    <div key={entry.version} className="footer-version-entry">
                      <div className="footer-version-node">
                        <span className={`footer-version-dot ${i === 0 ? 'footer-version-dot-current' : ''}`} />
                        {i < CHANGELOG.length - 1 && <span className="footer-version-line" />}
                      </div>
                      <div className="footer-version-body">
                        <p className="footer-version-head">
                          <strong>v{entry.version}</strong>
                          <span>{entry.date}</span>
                          {i === 0 && <span className="footer-version-current">მიმდინარე</span>}
                        </p>
                        <ul>
                          {entry.changes.map((c, j) => <li key={j}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="footer-version-btn" onClick={() => setVersionsOpen(o => !o)}>
              v{APP_VERSION}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
