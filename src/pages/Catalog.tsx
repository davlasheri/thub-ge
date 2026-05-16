import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useVehicle } from '../context/VehicleContext';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';
import { useCatalog } from '../context/CatalogContext';
import { getCatName } from '../utils/catalog';
import { MODELS, getYearsForModel } from '../data/vehicles';
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
  const { t, tf, lang } = useLang();
  const { products } = useProducts();
  const { catalog } = useCatalog();

  const [openModelId, setOpenModelId]     = useState<ModelId | null>(vehicle?.modelId ?? null);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [activeLeaf, setActiveLeaf]       = useState<ActiveLeaf | null>(null);
  const [yearFilter, setYearFilter]       = useState<number | 'all'>(vehicle?.year ?? 'all');

  const tSection = (id: string) => {
    const s = catalog.find(x => x.id === id);
    return s ? getCatName(s, lang, 'section') : id;
  };
  const tSub = (sectionId: string, subId: string) => {
    const sub = catalog.find(x => x.id === sectionId)?.subsections.find(x => x.id === subId);
    return sub ? getCatName(sub, lang, 'sub') : subId;
  };

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

  const activeModel   = activeLeaf ? MODELS.find(m => m.id === activeLeaf.modelId)   : null;
  const activeSection = activeLeaf ? catalog.find(s => s.id === activeLeaf.sectionId) : null;
  const activeSub     = activeSection?.subsections.find(s => s.id === activeLeaf?.subsectionId);

  const partCount = displayedProducts.length;
  const partWord = partCount === 1 ? t('cat_part') : t('cat_parts');

  return (
    <main className="catalog-page">
      <div className="container catalog-layout">

        {/* ── Left sidebar: tree ── */}
        <aside className="cat-sidebar">
          <div className="cat-sidebar-header">
            <span className="cat-sidebar-title">{t('cat_sidebar_title')}</span>
          </div>

          <nav className="cat-tree">
            {MODELS.map(model => {
              const modelOpen   = openModelId === model.id;
              const totalCount  = countFor(model.id as ModelId);

              return (
                <div key={model.id} className={`tree-model ${modelOpen ? 'tree-model-open' : ''}`}>

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

                  {modelOpen && (
                    <div className="tree-sections">
                      {catalog.map(section => {
                        const sectionOpen  = openSectionId === section.id;
                        const sectionCount = countFor(model.id as ModelId, section.id);
                        if (sectionCount === 0) return null;

                        return (
                          <div key={section.id} className="tree-section">

                            <button
                              className={`tree-section-btn ${sectionOpen ? 'tree-section-btn-open' : ''}`}
                              onClick={() => toggleSection(section.id)}
                            >
                              <img
                                src={section.image}
                                alt={tSection(section.id)}
                                className="tree-section-thumb"
                              />
                              <span className="tree-section-name">{tSection(section.id)}</span>
                              <span className="tree-section-count">{sectionCount}</span>
                              <svg
                                className={`tree-chevron ${sectionOpen ? 'tree-chevron-open' : ''}`}
                                width="12" height="12" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2.5"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>

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
                                        <span className="tree-sub-name">{tSub(section.id, sub.id)}</span>
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
              <h2>{t('cat_welcome_title')}</h2>
              <p>{t('cat_welcome_sub')}</p>
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
                  <span>{activeSection && tSection(activeSection.id)}</span>
                  <span className="bc-sep">›</span>
                  <span className="bc-active">{activeSub && activeSection && tSub(activeSection.id, activeSub.id)}</span>
                </nav>

                <div className="cat-year-filter">
                  <label className="cat-year-label">{t('cat_year_label')}</label>
                  <select
                    className="cat-year-select"
                    value={yearFilter}
                    onChange={e =>
                      setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
                    }
                  >
                    <option value="all">{t('cat_all_years')}</option>
                    {activeLeaf &&
                      getYearsForModel(activeLeaf.modelId).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="cat-content-title-row">
                <h2 className="cat-content-title">{activeSub && activeSection && tSub(activeSection.id, activeSub.id)}</h2>
                <span className="cat-result-count">
                  {partCount} {partWord}
                </span>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="cat-empty">
                  <div className="cat-empty-icon">🔍</div>
                  <h3>{t('cat_no_parts_title')}</h3>
                  <p style={{ whiteSpace: 'pre-line' }}>
                    {tf('cat_no_parts_body', {
                      sub: activeSub && activeSection ? tSub(activeSection.id, activeSub.id) : '',
                      model: activeModel?.name ?? '',
                      year: yearFilter !== 'all' ? ` ${yearFilter}` : '',
                    })}
                  </p>
                  <Link to="/contact" className="btn-primary">{t('cat_contact_btn')}</Link>
                </div>
              ) : (
                <div className="catalog-grid">
                  {displayedProducts.map(p => (
                    <CatalogCard
                      key={p.id}
                      product={p}
                      onAddToCart={() => addToCart(p)}
                      accentColor={activeModel?.color}
                      lang={lang}
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
  lang,
}: {
  product: Product;
  onAddToCart: () => void;
  accentColor?: string;
  lang: string;
}) {
  const { t } = useLang();

  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.floor(product.rating) ? 'star-on' : 'star-off'}>★</span>
  ));

  const displayName = lang === 'ka' ? product.nameGe : product.name;

  return (
    <div className="cat-card">
      <Link to={`/products/${product.id}`} className="cat-card-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {!product.inStock && <div className="cat-oos">{t('prod_out_of_stock')}</div>}
        {product.badge && (
          <span className={`badge badge-${product.badge} cat-badge`}>{product.badge}</span>
        )}
      </Link>

      <div className="cat-card-body">
        <p className="cat-pn">#{product.partNumber}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="cat-name">{displayName}</h3>
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
            {product.inStock ? t('cat_add_btn') : t('cat_unavailable')}
          </button>
        </div>
      </div>
    </div>
  );
}
