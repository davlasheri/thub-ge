import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { Lang } from '../data/translations';
import CartDrawer from './CartDrawer';
import './Header.css';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ka', label: 'KA' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

export default function Header() {
  const { totalItems } = useCart();
  const { t, lang, setLang } = useLang();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: t('nav_home') },
    { to: '/catalog', label: t('nav_catalogue') },
    { to: '/products', label: t('nav_all_parts') },
    { to: '/cars', label: t('nav_cars') },
    { to: '/service', label: t('nav_service') },
    { to: '/about', label: t('nav_about') },
    { to: '/contact', label: t('nav_contact') },
  ];

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <span className="logo-t">T</span>Hub
            <span className="logo-ge">.ge</span>
          </Link>

          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${location.pathname.startsWith(link.to) && (link.to !== '/' || location.pathname === '/') ? 'nav-link-active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <div className="lang-switcher">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  className={`lang-btn ${lang === l.code ? 'lang-btn-active' : ''}`}
                  onClick={() => setLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              className="cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </button>

            <button
              className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
