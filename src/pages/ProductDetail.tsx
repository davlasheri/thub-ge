import { useParams, Link, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="not-found">
        <h2>Product not found</h2>
        <Link to="/products" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}>★</span>
  ));

  return (
    <main className="detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Shop</Link>
          <span>/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <div className="detail-grid">
          {/* Image */}
          <div className="detail-img-wrap">
            <img src={product.image} alt={product.name} />
            {product.badge && (
              <span className={`badge badge-${product.badge} detail-badge`}>
                {product.badge}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <div className="detail-compat">
              {product.compatibility.map(c => (
                <span key={c} className="compat-tag">{c}</span>
              ))}
            </div>

            <h1 className="detail-name">{product.name}</h1>
            <p className="detail-name-ge">{product.nameGe}</p>

            <div className="detail-rating">
              <div className="stars">{stars}</div>
              <span className="rating-val">{product.rating}</span>
              <span className="rating-count">({product.reviews} reviews)</span>
            </div>

            <div className="detail-price-row">
              <span className="detail-price">{product.price.toLocaleString()} ₾</span>
              <span className={`detail-stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
              </span>
            </div>

            <p className="detail-desc">{product.description}</p>

            <div className="detail-actions">
              <button
                className="btn-primary detail-add-btn"
                onClick={() => { addToCart(product); }}
                disabled={!product.inStock}
              >
                {product.inStock ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart
                  </>
                ) : 'Out of Stock'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate(-1)}
              >
                ← Back
              </button>
            </div>

            <div className="detail-features">
              <div className="feature">
                <span>🚀</span>
                <span>1–3 day delivery across Georgia</span>
              </div>
              <div className="feature">
                <span>↩️</span>
                <span>30-day returns</span>
              </div>
              <div className="feature">
                <span>✅</span>
                <span>OEM quality guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="related-section">
            <h2 className="related-title">Related Products</h2>
            <div className="related-grid">
              {related.map(p => (
                <Link key={p.id} to={`/products/${p.id}`} className="related-card">
                  <img src={p.image} alt={p.name} />
                  <div className="related-info">
                    <p className="related-name">{p.name}</p>
                    <p className="related-price">{p.price.toLocaleString()} ₾</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
