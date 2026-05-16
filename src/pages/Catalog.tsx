import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useVehicle } from '../context/VehicleContext';
import { useCart } from '../context/CartContext';
import { CATALOG } from '../data/catalog';
import { MODELS, getYearsForModel } from '../data/vehicles';
import { products } from '../data/products';
import { ModelId, Product } from '../types';
import './Catalog.css';

interface ActiveLeaf {
  modelId: ModelId;
  sectionId: string;
  subsectionId: string;
}

export default function Catalog() {
  const { vehicle } = useVehicle();
  const { addToCart } = useCart();

  const [openModelId, setOpenModelId]     = useState<ModelId | null>(vehicle?.modelId ?? null);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [activeLeaf, setActiveLeaf]       = useState<ActiveLeaf | null>(null);
  const [yearFilter, setYearFilter]       = useState<number | 'all'>(vehicle?.year ?? 'all');

  const toggleModel = (id: ModelId) => {
    if (openModelId === id) {
      setOpenModelId(null);
      setOpenSectionId(null);
      setActiveLeaf(null);
    } else {
      setOpenModelId(id);
      setOpenSectionId(null);
      setActiveLeaf(null);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSectionId(prev => (prev === sectionId ? null : sectionId));
    setActiveLeaf(null);
  };

  const selectLeaf = (modelId: ModelId, sectionId: string, subsectionId: string) => {
    setOpenModelId(modelId);
    setOpenSectionId(sectionId);
    setActiveLeaf({ modelId, sectionId, subsectionId });
  };

  const countFor = (modelId: ModelId, sectionId?: string, subsectionId?: string): number => {
    return products.filter(p => {
      const range = p.fits[modelId];
      if (!range) return false;
      if (sectionId    && p.sectionId    !== sectionId)    return false;
      if (subsectionId && p.subsectionId !== subsectionId) return false;
      return true;
    }).length;
  };

  const displayedProducts = useMemo<Product[]>(() => {
    if (!activeLeaf) return [];
    return products.filter(p => {
      const range = p.fits[activeLeaf.modelId];
      if (!range) return false;
      if (yearFilter !== 'all' && (yearFilter < range.from || yearFilter > range.to)) return false;
      return p.subsectionId === activeLeaf.subsectionId;
    });
  }, [activeLeaf, yearFilter]);

  const activeModel   = activeLeaf ? MODELS.find(m => m.id === activeLeaf.modelId)         : null;
  const activeSection = activeLeaf ? CATALOG.find(s => s.id === activeLeaf.sectionId)       : null;
  const activeSub     = activeSection?.subsections.find(s => s.id === activeLeaf?.subsectionId);

  return (
    <main className="catalog-page">
      <div className="container catalog-layout">

        {/* ── Left sidebar: tree ── */}
        <aside className="cat-sidebar">
          <div className="cat-sidebar-header">
            <span className="cat-sidebar-title">Parts Catalogue</span>
          </div>

          <nav className="cat-tree">
            {MODELS.map(model => {
              const modelOpen   = openModelId === model.id;
              const totalCount  = countFor(model.id as ModelId);

              return (
                <div key={model.id} className={`tree-model ${modelOpen ? 'tree-model-open' : ''}`}>

                  {/* Model root node */}
                  <button
                    className="tree-model-btn"
                    onClick={() => toggleModel(model.id as ModelId)}
                    style={modelOpen ? { borderLeftColor: model.color } as React.CSSProperties : {}}
                  >
                    <span className="tree-model-dot" style={{ background: model.color }} />
                    <span className="tree-model-name">{model.fullName}</span>
                    <span className="tree-model-count">{totalCount}</span>
                    <svg
                      className={`tree-chevron ${modelOpen ? 'tree-chevron-open' : ''}`}
                      width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Sections under open model */}
                  {modelOpen && (
                    <div className="tree-sections">
                      {CATALOG.map(section => {
                        const sectionOpen  = openSectionId === section.id;
                        const sectionCount = countFor(model.id as ModelId, section.id);
                        if (sectionCount === 0) return null;

                        return (
                          <div key={section.id} className="tree-section">

                            {/* Section node — thumbnail + name */}
                            <button
                              className={`tree-section-btn ${sectionOpen ? 'tree-section-btn-open' : ''}`}
                              onClick={() => toggleSection(section.id)}
                            >
                              <img
                                src={section.image}
                                alt={section.name}
                                className="tree-section-thumb"
                              />
                              <span className="tree-section-name">{section.name}</span>
                              <span className="tree-section-count">{sectionCount}</span>
                              <svg
                                className={`tree-chevron ${sectionOpen ? 'tree-chevron-open' : ''}`}
                                width="12" height="12" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2.5"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>

                            {/* Subsection leaves */}
                            {sectionOpen && (
                              <ul className="tree-subsections">
                                {section.subsections.map(sub => {
                                  const subCount = countFor(model.id as ModelId, section.id, sub.id);
                                  if (subCount === 0) return null;
                                  const isActive =
                                    activeLeaf?.modelId      === model.id &&
                                    activeLeaf?.sectionId    === section.id &&
                                    activeLeaf?.subsectionId === sub.id;

                                  return (
                                    <li key={sub.id}>
                                      <button
                                        className={`tree-sub-btn ${isActive ? 'tree-sub-btn-active' : ''}`}
                                        style={isActive
                                          ? { color: model.color, borderLeftColor: model.color } as React.CSSProperties
                                          : {}}
                                        onClick={() => selectLeaf(model.id as ModelId, section.id, sub.id)}
                                      >
                                        <span className="tree-sub-name">{sub.name}</span>
                                        <span className="tree-sub-count">({subCount})</span>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Right: Products ── */}
        <div className="cat-content">
          {!activeLeaf ? (
            <div className="cat-welcome">
              <div className="cat-welcome-icon">⚡</div>
              <h2>Select a category</h2>
              <p>Expand a model in the tree, then choose a parts category to browse compatible parts.</p>
              <div className="cat-welcome-hints">
                {MODELS.map(m => (
                  <button
                    key={m.id}
                    className="cat-welcome-model"
                    style={{ borderColor: m.color }}
                    onClick={() => toggleModel(m.id as ModelId)}
                  >
                    <span style={{ color: m.color, fontWeight: 800 }}>{m.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.years.from}–{m.years.to}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="cat-content-header">
                <nav className="cat-breadcrumb">
                  <span style={{ color: activeModel?.color, fontWeight: 700 }}>{activeModel?.name}</span>
                  <span className="bc-sep">›</span>
                  <span>{activeSection?.name}</span>
                  <span className="bc-sep">›</span>
                  <span className="bc-active">{activeSub?.name}</span>
                </nav>

                <div className="cat-year-filter">
                  <label className="cat-year-label">Year:</label>
                  <select
                    className="cat-year-select"
                    value={yearFilter}
                    onChange={e =>
                      setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
                    }
                  >
                    <option value="all">All years</option>
                    {activeLeaf &&
                      getYearsForModel(activeLeaf.modelId).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="cat-content-title-row">
                <h2 className="cat-content-title">{activeSub?.name}</h2>
                <span className="cat-result-count">
                  {displayedProducts.length} part{displayedProducts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="cat-empty">
                  <div className="cat-empty-icon">🔍</div>
                  <h3>No parts found</h3>
                  <p>
                    No {activeSub?.name} parts listed for {activeModel?.name}
                    {yearFilter !== 'all' ? ` ${yearFilter}` : ''} yet.<br />
                    Contact us — we can source it.
                  </p>
                  <Link to="/contact" className="btn-primary">Contact Us</Link>
                </div>
              ) : (
                <div className="catalog-grid">
                  {displayedProducts.map(p => (
                    <CatalogCard
                      key={p.id}
                      product={p}
                      onAddToCart={() => addToCart(p)}
                      accentColor={activeModel?.color}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function CatalogCard({
  product,
  onAddToCart,
  accentColor,
}: {
  product: Product;
  onAddToCart: () => void;
  accentColor?: string;
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
            style={product.inStock && accentColor
              ? { background: accentColor } as React.CSSProperties
              : {}}
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
