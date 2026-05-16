import { useParams, Link, useNavigate } from 'react-router-dom';
import { products, getProductById } from '../data/products';
import { useCart } from '../context/CartContext';
import { useVehicle } from '../context/VehicleContext';
import { MODELS } from '../data/vehicles';
import { CATALOG } from '../data/catalog';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { vehicle } = useVehicle();
  const product = getProductById(id ?? '');

  if (!product) {
    return (
      <div className="not-found">
        <h2>Product not found</h2>
        <Link to="/catalog" className="btn-primary">Back to Catalogue</Link>
      </div>
    );
  }

  const section = CATALOG.find(s => s.id === product.sectionId);
  const subsection = section?.subsections.find(s => s.id === product.subsectionId);
  const model = vehicle ? MODELS.find(m => m.id === vehicle.modelId) : null;

  const related = products
    .filter(p => p.subsectionId === product.subsectionId && p.id !== product.id)
    .slice(0, 3);

  const fitEntries = Object.entries(product.fits);

  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}>★</span>
  ));

  return (
    <main className="detail-page">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/catalog">Catalogue</Link>
          <span>/</span>
          <span>{section?.name}</span>
          <span>/</span>
          <span>{subsection?.name}</span>
          <span>/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <div className="detail-grid">
          <div className="detail-img-wrap">
            <img src={product.image} alt={product.name} />
            {product.badge && (
              <span className={`badge badge-${product.badge} detail-badge`}>{product.badge}</span>
            )}
          </div>

          <div className="detail-info">
            <p className="detail-pn">Part #{product.partNumber}</p>
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

            {/* Compatibility table */}
            <div className="fits-section">
              <p className="fits-title">Compatibility</p>
              <div className="fits-grid">
                {fitEntries.map(([modelId, range]) => {
                  const m = MODELS.find(x => x.id === modelId);
                  const isCurrent = vehicle?.modelId === modelId;
                  return (
                    <div
                      key={modelId}
                      className={`fits-chip ${isCurrent ? 'fits-chip-current' : ''}`}
                      style={isCurrent ? { borderColor: model?.color, color: model?.color } as React.CSSProperties : {}}
                    >
                      <span className="fits-model">{m?.name}</span>
                      <span className="fits-years">{range.from}–{range.to}</span>
                      {isCurrent && <span className="fits-yours">Your car</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="btn-primary detail-add-btn"
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
                style={product.inStock && model ? { background: model.color } as React.CSSProperties : {}}
              >
                {product.inStock ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    Add to Cart
                  </>
                ) : 'Out of Stock'}
              </button>
              <button className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
            </div>

            <div className="detail-features">
              <div className="feature"><span>🚀</span><span>1–3 day delivery across Georgia</span></div>
              <div className="feature"><span>↩️</span><span>30-day returns</span></div>
              <div className="feature"><span>✅</span><span>OEM quality guaranteed</span></div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="related-section">
            <h2 className="related-title">Related Parts</h2>
            <div className="related-grid">
              {related.map(p => (
                <Link key={p.id} to={`/products/${p.id}`} className="related-card">
                  <img src={p.image} alt={p.name} />
                  <div className="related-info">
                    <p style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>#{p.partNumber}</p>
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
