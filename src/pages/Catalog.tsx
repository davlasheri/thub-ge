import { useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useVehicle } from '../context/VehicleContext';
import { CATALOG } from '../data/catalog';
import { filterByVehicle, filterByVehicleAndSubsection } from '../data/products';
import { MODELS } from '../data/vehicles';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import './Catalog.css';

export default function Catalog() {
  const { vehicle } = useVehicle();
  const { addToCart } = useCart();
  const [activeSectionId, setActiveSectionId] = useState<string>(CATALOG[0].id);
  const [activeSubsectionId, setActiveSubsectionId] = useState<string>(CATALOG[0].subsections[0].id);

  if (!vehicle) return <Navigate to="/" replace />;

  const model = MODELS.find(m => m.id === vehicle.modelId);
  const activeSection = CATALOG.find(s => s.id === activeSectionId)!;

  const subsectionParts = useMemo(() =>
    filterByVehicleAndSubsection(vehicle.modelId, vehicle.year, activeSubsectionId),
    [vehicle, activeSubsectionId]
  );

  const sectionCounts = useMemo(() => {
    const all = filterByVehicle(vehicle.modelId, vehicle.year);
    const map: Record<string, number> = {};
    CATALOG.forEach(s => {
      map[s.id] = all.filter(p => p.sectionId === s.id).length;
    });
    return map;
  }, [vehicle]);

  const subsectionCounts = useMemo(() => {
    const all = filterByVehicle(vehicle.modelId, vehicle.year);
    const map: Record<string, number> = {};
    activeSection.subsections.forEach(sub => {
      map[sub.id] = all.filter(p => p.subsectionId === sub.id).length;
    });
    return map;
  }, [vehicle, activeSectionId]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const section = CATALOG.find(s => s.id === sectionId)!;
    setActiveSubsectionId(section.subsections[0].id);
  };

  return (
    <main className="catalog-page">
      <div className="container catalog-layout">

        {/* Left: Section tree */}
        <aside className="catalog-sidebar">
          <div className="sidebar-header">
            <span className="sidebar-vehicle" style={{ color: model?.color }}>
              {model?.name} · {vehicle.year}
            </span>
            <p className="sidebar-hint">Parts Catalogue</p>
          </div>

          <nav className="section-nav">
            {CATALOG.map(section => (
              <div key={section.id} className="section-group">
                <button
                  className={`section-btn ${activeSectionId === section.id ? 'section-btn-active' : ''}`}
                  onClick={() => handleSectionClick(section.id)}
                  style={activeSectionId === section.id ? { color: model?.color } as React.CSSProperties : {}}
                >
                  <span className="section-icon">{section.icon}</span>
                  <span className="section-name">{section.name}</span>
                  {sectionCounts[section.id] > 0 && (
                    <span className="section-count">{sectionCounts[section.id]}</span>
                  )}
                </button>

                {activeSectionId === section.id && (
                  <div className="subsection-list">
                    {section.subsections.map(sub => (
                      <button
                        key={sub.id}
                        className={`subsection-btn ${activeSubsectionId === sub.id ? 'subsection-btn-active' : ''}`}
                        onClick={() => setActiveSubsectionId(sub.id)}
                        style={activeSubsectionId === sub.id
                          ? { borderLeftColor: model?.color, color: model?.color } as React.CSSProperties
                          : {}}
                      >
                        <span className="subsection-name">{sub.name}</span>
                        <span className="subsection-count">
                          {subsectionCounts[sub.id] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Right: Parts grid */}
        <div className="catalog-content">
          <div className="catalog-breadcrumb">
            <span>{activeSection.icon} {activeSection.name}</span>
            <span className="bc-sep">›</span>
            <span className="bc-active">
              {activeSection.subsections.find(s => s.id === activeSubsectionId)?.name}
            </span>
          </div>

          <div className="catalog-results-header">
            <h2 className="catalog-section-title">
              {activeSection.subsections.find(s => s.id === activeSubsectionId)?.name}
            </h2>
            <span className="catalog-count">
              {subsectionParts.length} part{subsectionParts.length !== 1 ? 's' : ''} for {model?.name} {vehicle.year}
            </span>
          </div>

          {subsectionParts.length === 0 ? (
            <div className="catalog-empty">
              <div className="catalog-empty-icon">🔍</div>
              <h3>No parts found</h3>
              <p>No parts listed for {model?.name} {vehicle.year} in this category yet.<br />
                Contact us — we may be able to source it.</p>
              <Link to="/contact" className="btn-primary">Contact Us</Link>
            </div>
          ) : (
            <div className="catalog-grid">
              {subsectionParts.map(p => (
                <CatalogCard key={p.id} product={p} onAddToCart={() => addToCart(p)} modelColor={model?.color} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function CatalogCard({
  product,
  onAddToCart,
  modelColor,
}: {
  product: Product;
  onAddToCart: () => void;
  modelColor?: string;
}) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.floor(product.rating) ? 'star-on' : 'star-off'}>★</span>
  ));

  return (
    <div className="cat-card">
      <Link to={`/products/${product.id}`} className="cat-card-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {!product.inStock && <div className="cat-oos">Out of Stock</div>}
        {product.badge && (
          <span className={`badge badge-${product.badge} cat-badge`}>{product.badge}</span>
        )}
      </Link>

      <div className="cat-card-body">
        <p className="cat-pn">#{product.partNumber}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="cat-name">{product.name}</h3>
        </Link>
        <p className="cat-desc">{product.description}</p>

        <div className="cat-rating">
          <div className="cat-stars">{stars}</div>
          <span className="cat-reviews">({product.reviews})</span>
        </div>

        <div className="cat-footer">
          <span className="cat-price">{product.price.toLocaleString()} ₾</span>
          <button
            className="cat-add-btn"
            style={product.inStock && modelColor ? { background: modelColor } as React.CSSProperties : {}}
            onClick={onAddToCart}
            disabled={!product.inStock}
          >
            {product.inStock ? 'Add to Cart' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}
