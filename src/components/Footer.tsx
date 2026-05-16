import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="logo-t">T</span>Hub<span className="logo-ge">.ge</span>
          </Link>
          <p className="footer-tagline">Premium Tesla Parts & Accessories<br />delivered across Georgia 🇬🇪</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/products">All Products</Link>
            <Link to="/products?category=exterior">Exterior</Link>
            <Link to="/products?category=interior">Interior</Link>
            <Link to="/products?category=charging">Charging</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <a href="#">Shipping Policy</a>
            <a href="#">Returns</a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href="tel:+995322001234">+995 32 200 12 34</a>
            <a href="mailto:info@thub.ge">info@thub.ge</a>
            <p className="footer-address">Tbilisi, Georgia</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} THub.ge — All rights reserved. Not affiliated with Tesla, Inc.</p>
        </div>
      </div>
    </footer>
  );
}
