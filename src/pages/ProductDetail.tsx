import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useVehicle } from '../context/VehicleContext';
import { useLang } from '../context/LanguageContext';
import { itemStatusLabel } from '../utils/itemStatus';
import { useProducts } from '../context/ProductsContext';
import { useCatalog } from '../context/CatalogContext';
import { useModels } from '../context/ModelsContext';
import { getCatName } from '../utils/catalog';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { vehicle } = useVehicle();
  const { t, lang } = useLang();
  const { products, getById } = useProducts();
  const { catalog } = useCatalog();
  const { models } = useModels();
  const product = getById(id ?? '');

  if (!product) {
    return (
      <div className="not-found">
        <h2>{t('detail_not_found')}</h2>
        <Link to="/catalog" className="btn-primary">{t('detail_back_cat')}</Link>
      </div>
    );
  }

  const section = catalog.find(s => s.id === product.sectionId);
  const subsection = section?.subsections.find(s => s.id === product.subsectionId);
  const model = vehicle ? models.find(m => m.id === vehicle.modelId) : null;

  const related = products
    .filter(p => p.subsectionId === product.subsectionId && p.id !== product.id)
    .slice(0, 3);

  const fitEntries = Object.entries(product.fits);

  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}>★</span>
  ));

  const tSection = (id: string) => {
    const s = catalog.find(x => x.id === id);
    return s ? getCatName(s, lang, 'section') : id;
  };
  const tSub = (sectionId: string, subId: string) => {
    const sub = catalog.find(x => x.id === sectionId)?.subsections.find(x => x.id === subId);
    return sub ? getCatName(sub, lang, 'sub') : subId;
  };

  const displayName = lang === 'ka' ? product.nameGe : product.name;

  return (
    <main className="detail-page">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/catalog">{t('detail_catalogue')}</Link>
          <span>/</span>
          <span>{section && tSection(section.id)}</span>
          <span>/</span>
          <span>{section && subsection && tSub(section.id, subsection.id)}</span>
          <span>/</span>
          <span className="breadcrumb-current">{displayName}</span>
        </nav>

        <div className="detail-grid">
          <div className="detail-img-wrap">
            <img src={product.image} alt={product.name} />
            {product.badge && (
              <span className={`badge badge-${product.badge} detail-badge`}>{itemStatusLabel(product.badge, lang)}</span>
            )}
          </div>

          <div className="detail-info">
            <p className="detail-pn">{t('detail_part_num')}{product.partNumber}</p>
            <h1 className="detail-name">{displayName}</h1>
            {lang !== 'ka' && product.nameGe && (
              <p className="detail-name-ge">{product.nameGe}</p>
            )}

            <div className="detail-rating">
              <div className="stars">{stars}</div>
              <span className="rating-val">{product.rating}</span>
              <span className="rating-count">({product.reviews} {t('detail_reviews')})</span>
            </div>

            <div className="detail-price-row">
              <span className="detail-price">{product.price.toLocaleString()} ₾</span>
              <span className={`detail-stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {product.inStock ? t('detail_in_stock') : t('detail_out_of_stock')}
              </span>
            </div>

            <p className="detail-desc">{product.description}</p>

            <div className="fits-section">
              <p className="fits-title">{t('detail_compatibility')}</p>
              <div className="fits-grid">
                {fitEntries.map(([modelId, range]) => {
                  const m = models.find(x => x.id === modelId);
                  const isCurrent = vehicle?.modelId === modelId;
                  return (
                    <div
                      key={modelId}
                      className={`fits-chip ${isCurrent ? 'fits-chip-current' : ''}`}
                      style={isCurrent ? { borderColor: model?.color, color: model?.color } as React.CSSProperties : {}}
                    >
                      <span className="fits-model">{m?.name ?? modelId}</span>
                      <span className="fits-years">{range?.from}–{range?.to}</span>
                      {isCurrent && <span className="fits-yours">{t('detail_your_car')}</span>}
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
                    {t('detail_add_to_cart')}
                  </>
                ) : t('detail_out_of_stock')}
              </button>
              <button className="btn-secondary" onClick={() => navigate(-1)}>{t('detail_back')}</button>
            </div>

            <div className="detail-features">
              <div className="feature"><span>🚀</span><span>{t('detail_delivery')}</span></div>
              <div className="feature"><span>↩️</span><span>{t('detail_returns')}</span></div>
              <div className="feature"><span>✅</span><span>{t('detail_quality')}</span></div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="related-section">
            <h2 className="related-title">{t('detail_related')}</h2>
            <div className="related-grid">
              {related.map(p => (
                <Link key={p.id} to={`/products/${p.id}`} className="related-card">
                  <img src={p.image} alt={p.name} />
                  <div className="related-info">
                    <p style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>#{p.partNumber}</p>
                    <p className="related-name">{lang === 'ka' ? p.nameGe : p.name}</p>
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
