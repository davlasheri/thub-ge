import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import './Footer.css';

export default function Footer() {
  const { t } = useLang();

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
            <Link to="/products">{t('footer_all_products')}</Link>
            <Link to="/products?category=exterior">{t('footer_exterior_lnk')}</Link>
            <Link to="/products?category=interior">{t('footer_interior_lnk')}</Link>
            <Link to="/products?category=charging">{t('footer_charging_lnk')}</Link>
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
        <div className="container">
          <p>© {new Date().getFullYear()} THub.ge — {t('footer_rights')}</p>
        </div>
      </div>
    </footer>
  );
}
