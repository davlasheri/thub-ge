import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { products, categories } from '../data/products';
import './Home.css';

const featuredProducts = products.filter(p => p.badge === 'popular' || p.badge === 'new').slice(0, 4);

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <div className="hero-badge">⚡ Georgia's #1 Tesla Parts Store</div>
          <h1 className="hero-title">
            Power Your<br />
            <span className="hero-accent">Tesla</span> Experience
          </h1>
          <p className="hero-sub">
            Premium OEM and aftermarket parts for every Tesla model.<br />
            Fast delivery across Georgia. Expert support in Georgian.
          </p>
          <div className="hero-cta">
            <Link to="/products" className="btn-primary hero-btn">
              Shop Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link to="/about" className="btn-secondary hero-btn">Learn More</Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">2,000+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">5,400+</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-div" />
            <div className="stat">
              <span className="stat-num">1–3</span>
              <span className="stat-label">Day Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="category-grid">
            {categories.filter(c => c.id !== 'all').map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="category-card"
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
                <span className="category-name-ge">{cat.nameGe}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products" className="see-all">
              See All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          <div className="product-grid">
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <span className="trust-icon">🚀</span>
              <h3>Fast Delivery</h3>
              <p>1–3 day shipping to all major cities in Georgia</p>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✅</span>
              <h3>OEM Quality</h3>
              <p>Genuine and premium aftermarket parts only</p>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🔧</span>
              <h3>Expert Support</h3>
              <p>Tesla-certified technicians available by phone</p>
            </div>
            <div className="trust-item">
              <span className="trust-icon">↩️</span>
              <h3>Easy Returns</h3>
              <p>30-day hassle-free return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="container cta-inner">
          <div>
            <h2>New to THub.ge?</h2>
            <p>Get 10% off your first order. Use code <strong>THUB10</strong> at checkout.</p>
          </div>
          <Link to="/products" className="btn-primary cta-btn">Start Shopping</Link>
        </div>
      </section>
    </main>
  );
}
