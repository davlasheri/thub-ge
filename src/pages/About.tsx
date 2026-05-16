import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <main className="about-page">
      <div className="container">
        <div className="about-hero">
          <span className="about-badge">⚡ About Us</span>
          <h1>Georgia's Premier Tesla<br />Parts & Accessories Store</h1>
          <p>
            THub.ge was founded by Tesla enthusiasts in Tbilisi with a single mission:
            make premium Tesla parts accessible to every Georgian Tesla owner, without
            the hassle of international shipping or inflated margins.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <span className="about-icon">🎯</span>
            <h3>Our Mission</h3>
            <p>To provide Georgia's Tesla community with genuine OEM parts and the best aftermarket upgrades at honest prices, with expert support in Georgian.</p>
          </div>
          <div className="about-card">
            <span className="about-icon">🏆</span>
            <h3>Why THub.ge?</h3>
            <p>We are Tesla owners ourselves. We test every product before listing it. Our team speaks Georgian, Russian, and English — support you can actually use.</p>
          </div>
          <div className="about-card">
            <span className="about-icon">🚀</span>
            <h3>Fast Delivery</h3>
            <p>Same-day dispatch for in-stock items. 1–3 day delivery to Tbilisi, Kutaisi, Batumi, and all major cities. Free shipping on orders over 500 ₾.</p>
          </div>
        </div>

        <div className="about-stats-row">
          <div className="about-stat">
            <span className="about-stat-num">2019</span>
            <span className="about-stat-label">Founded</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">5,400+</span>
            <span className="about-stat-label">Happy Customers</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">2,000+</span>
            <span className="about-stat-label">Products</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-num">4.9★</span>
            <span className="about-stat-label">Average Rating</span>
          </div>
        </div>

        <div className="about-cta">
          <h2>Ready to upgrade your Tesla?</h2>
          <p>Browse our full catalog of premium parts and accessories.</p>
          <Link to="/products" className="btn-primary about-cta-btn">Shop Now</Link>
        </div>
      </div>
    </main>
  );
}
