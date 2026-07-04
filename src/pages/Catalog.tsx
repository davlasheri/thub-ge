import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { itemStatusLabel } from '../utils/itemStatus';
import { useProducts } from '../context/ProductsContext';
import { useCatalog } from '../context/CatalogContext';
import { useModels } from '../context/ModelsContext';
import { getCatName } from '../utils/catalog';
import { TeslaModel, CatalogSection, Product } from '../types';
import { Generation, getGenerations } from '../data/generations';
import { TranslationKey } from '../data/translations';
import './Catalog.css';

type TFn = (k: TranslationKey) => string;

type EpcView = 'models' | 'groups' | 'parts';

// ── Silhouettes ───────────────────────────────────────────────────────────────
function SilhouetteSedan({ tall }: { tall?: boolean }) {
  return (
    <svg viewBox="0 0 120 52" fill="currentColor" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
      <path d={tall
        ? 'M8 34 C8 34 18 18 35 16 L52 13 L68 13 L85 16 C102 18 112 34 112 34 L112 38 L100 38 C100 35 97 32 93 32 C89 32 86 35 86 38 L34 38 C34 35 31 32 27 32 C23 32 20 35 20 38 L8 38 Z'
        : 'M8 36 C8 36 20 22 36 20 L50 16 L70 16 L84 20 C100 22 112 36 112 36 L112 39 L100 39 C100 36 97 33 93 33 C89 33 86 36 86 39 L34 39 C34 36 31 33 27 33 C23 33 20 36 20 39 L8 39 Z'}
      />
      <circle cx="27" cy="39" r="6" /><circle cx="93" cy="39" r="6" />
      <circle cx="27" cy="39" r="2.5" fill="var(--bg2)" />
      <circle cx="93" cy="39" r="2.5" fill="var(--bg2)" />
    </svg>
  );
}
function SilhouetteSUV({ tall }: { tall?: boolean }) {
  return (
    <svg viewBox="0 0 120 52" fill="currentColor" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
      <path d={tall
        ? 'M8 34 C8 34 15 14 30 12 L45 10 L75 10 L90 12 C105 14 112 34 112 34 L112 38 L100 38 C100 35 97 32 93 32 C89 32 86 35 86 38 L34 38 C34 35 31 32 27 32 C23 32 20 35 20 38 L8 38 Z'
        : 'M8 35 C8 35 16 16 30 14 L44 11 L76 11 L90 14 C104 16 112 35 112 35 L112 39 L100 39 C100 36 97 33 93 33 C89 33 86 36 86 39 L34 39 C34 36 31 33 27 33 C23 33 20 36 20 39 L8 39 Z'}
      />
      <circle cx="27" cy="39" r="6" /><circle cx="93" cy="39" r="6" />
      <circle cx="27" cy="39" r="2.5" fill="var(--bg2)" />
      <circle cx="93" cy="39" r="2.5" fill="var(--bg2)" />
    </svg>
  );
}
function ModelSilhouette({ modelId, tall }: { modelId: string; tall?: boolean }) {
  const isSUV = modelId === 'MY' || modelId === 'MX';
  return isSUV ? <SilhouetteSUV tall={tall} /> : <SilhouetteSedan tall={tall} />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Catalog() {
  const { addToCart } = useCart();
  const { t, lang } = useLang();
  const { products } = useProducts();
  const { catalog } = useCatalog();
  const { models } = useModels();

  const [view, setView] = useState<EpcView>('models');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [yearModalModelId, setYearModalModelId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeSubsectionId, setActiveSubsectionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selectedModel = models.find(m => m.id === selectedModelId);
  const modalModel    = models.find(m => m.id === yearModalModelId);

  const selectGeneration = (modelId: string, gen: Generation) => {
    setSelectedModelId(modelId);
    setSelectedGen(gen);
    setYearModalModelId(null);
    setActiveSectionId(null);
    setActiveSubsectionId(null);
    setSearch('');
    setView('groups');
  };

  const openSubsection = (sectionId: string, subsectionId: string) => {
    setActiveSectionId(sectionId);
    setActiveSubsectionId(subsectionId);
    setView('parts');
  };

  const goToGroups = () => { setView('groups'); setActiveSectionId(null); setActiveSubsectionId(null); };
  const goToModels = () => { setView('models'); setSelectedModelId(null); setSelectedGen(null); };

  const countInSubsection = (subsectionId: string): number => {
    if (!selectedModelId || !selectedGen) return 0;
    return products.filter(p => {
      const range = p.fits[selectedModelId];
      if (!range) return false;
      return selectedGen.from <= range.to && selectedGen.to >= range.from
        && p.subsectionId === subsectionId;
    }).length;
  };

  const partsForSubsection = useMemo<Product[]>(() => {
    if (!selectedModelId || !selectedGen || !activeSubsectionId) return [];
    return products.filter(p => {
      const range = p.fits[selectedModelId];
      if (!range) return false;
      return selectedGen.from <= range.to && selectedGen.to >= range.from
        && p.subsectionId === activeSubsectionId;
    });
  }, [selectedModelId, selectedGen, activeSubsectionId, products]);

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog
      .map(sec => ({
        ...sec,
        subsections: sec.subsections.filter(sub =>
          getCatName(sub, lang, 'sub').toLowerCase().includes(q)
        ),
      }))
      .filter(sec =>
        getCatName(sec, lang, 'section').toLowerCase().includes(q) ||
        sec.subsections.length > 0
      );
  }, [catalog, search, lang]);

  const tSection = (sec: CatalogSection) => getCatName(sec, lang, 'section');
  const tSub = (sub: { id: string; name: string; nameGe?: string }) => getCatName(sub, lang, 'sub');

  const activeSection = catalog.find(s => s.id === activeSectionId);
  const activeSub     = activeSection?.subsections.find(s => s.id === activeSubsectionId);

  return (
    <main className="epc-page">
      <div className="container">

        {/* ── Year-range modal ── */}
        {yearModalModelId && modalModel && (
          <div className="epc-modal-overlay" onClick={() => setYearModalModelId(null)}>
            <div className="epc-modal" onClick={e => e.stopPropagation()}>
              <div className="epc-modal-header">
                <span className="epc-modal-title">{t('epc_select_title')}</span>
                <button className="epc-modal-close" onClick={() => setYearModalModelId(null)}>×</button>
              </div>
              <div className="epc-modal-body">
                <p className="epc-parts-label">{t('epc_parts_label')}</p>
                <h2 className="epc-modal-model-name" style={{ color: modalModel.color }}>{modalModel.name}</h2>
                <div className="epc-modal-silhouette" style={{ color: modalModel.color }}>
                  <ModelSilhouette
                    modelId={modalModel.id}
                    tall={modalModel.id === 'MX' || modalModel.id === 'MS'}
                  />
                </div>
                <div className="epc-gen-list">
                  {getGenerations(modalModel.id, modalModel.years.from, modalModel.years.to).map(gen => (
                    <button
                      key={gen.id}
                      className="epc-gen-btn"
                      onClick={() => selectGeneration(modalModel.id, gen)}
                    >
                      {gen.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Model selection ── */}
        {view === 'models' && (
          <div className="epc-models-view">
            <div className="epc-page-header">
              <h1>{t('epc_title')}</h1>
              <p>{t('epc_subtitle')}</p>
            </div>
            <div className="epc-model-list">
              {models.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onClick={() => setYearModalModelId(model.id)}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: EPC Groups ── */}
        {view === 'groups' && selectedModel && selectedGen && (
          <div className="epc-groups-view">
            <nav className="epc-breadcrumb">
              <button className="epc-bc-btn" onClick={goToModels}>{t('epc_all_models')}</button>
              <span className="epc-bc-sep">›</span>
              <span className="epc-bc-model" style={{ color: selectedModel.color }}>{selectedModel.name}</span>
              <span className="epc-bc-sep">›</span>
              <span className="epc-bc-gen">{selectedGen.label}</span>
            </nav>

            <div className="epc-search-wrap">
              <input
                className="epc-search"
                type="text"
                placeholder={t('epc_search_ph')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="epc-no-results">
                <p>{t('epc_no_results')}</p>
                <button className="btn-secondary" onClick={() => setSearch('')}>{t('prod_clear_filters')}</button>
              </div>
            ) : (
              <div className="epc-groups-grid">
                {filteredCatalog.map(section => (
                  <GroupCard
                    key={section.id}
                    section={section}
                    tSection={tSection}
                    tSub={tSub}
                    countInSubsection={countInSubsection}
                    onSubsectionClick={openSubsection}
                    accentColor={selectedModel.color}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Parts ── */}
        {view === 'parts' && selectedModel && selectedGen && activeSection && activeSub && (
          <div className="epc-parts-view">
            <nav className="epc-breadcrumb">
              <button className="epc-bc-btn" onClick={goToModels}>{t('epc_all_models')}</button>
              <span className="epc-bc-sep">›</span>
              <button className="epc-bc-btn" onClick={goToGroups}>
                <span style={{ color: selectedModel.color }}>{selectedModel.name}</span>
                {' · '}{selectedGen.label}
              </button>
              <span className="epc-bc-sep">›</span>
              {activeSection.groupNumber && (
                <span className="epc-bc-group">{activeSection.groupNumber} · {tSection(activeSection)}</span>
              )}
              <span className="epc-bc-sep">›</span>
              <span className="epc-bc-active">{tSub(activeSub)}</span>
            </nav>

            <div className="epc-parts-header">
              <div>
                <h2 className="epc-parts-title">{tSub(activeSub)}</h2>
                <p className="epc-parts-sub">
                  {partsForSubsection.length > 0
                    ? `${partsForSubsection.length} ${t('cat_parts')}`
                    : t('epc_no_stock')}
                </p>
              </div>
              <button className="btn-secondary epc-back-btn" onClick={goToGroups}>
                ← {t('epc_back_epc')}
              </button>
            </div>

            {partsForSubsection.length === 0 ? (
              <div className="epc-empty">
                <div className="epc-empty-icon">🔍</div>
                <h3>{t('cat_no_parts_title')}</h3>
                <p>{t('epc_no_stock_desc')}</p>
                <Link to="/contact" className="btn-primary">{t('cat_contact_btn')}</Link>
              </div>
            ) : (
              <div className="epc-catalog-grid">
                {partsForSubsection.map(p => (
                  <EpcCard
                    key={p.id}
                    product={p}
                    onAddToCart={() => addToCart(p)}
                    accentColor={selectedModel.color}
                    lang={lang}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}

// ── ModelCard ─────────────────────────────────────────────────────────────────
function ModelCard({ model, onClick, t }: { model: TeslaModel; onClick: () => void; t: TFn }) {
  const isTall = model.id === 'MX' || model.id === 'MS';
  return (
    <div
      className="epc-model-card"
      style={{ '--model-color': model.color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="epc-model-card-info">
        <p className="epc-parts-label">{t('epc_parts_label')}</p>
        <h2 className="epc-model-name">{model.name}</h2>
        <p className="epc-model-years">{model.years.from} – {model.years.to}</p>
        <button
          className="epc-view-btn"
          style={{ background: model.color } as React.CSSProperties}
          onClick={onClick}
        >
          {t('epc_view_btn')} →
        </button>
      </div>
      <div className="epc-model-card-visual">
        <div className="epc-sil-wrap" style={{ color: model.color }}>
          <ModelSilhouette modelId={model.id} tall={isTall} />
        </div>
      </div>
    </div>
  );
}

// ── GroupCard ─────────────────────────────────────────────────────────────────
function GroupCard({
  section, tSection, tSub, countInSubsection, onSubsectionClick, accentColor,
}: {
  section: CatalogSection;
  tSection: (s: CatalogSection) => string;
  tSub: (s: { id: string; name: string; nameGe?: string }) => string;
  countInSubsection: (id: string) => number;
  onSubsectionClick: (sectionId: string, subId: string) => void;
  accentColor?: string;
}) {
  return (
    <div className="epc-group-card">
      <div className="epc-group-img-wrap">
        <img src={section.image} alt={tSection(section)} loading="lazy" />
        {section.groupNumber && (
          <span className="epc-group-num-badge">{section.groupNumber}</span>
        )}
      </div>
      <div className="epc-group-body">
        <h3 className="epc-group-heading">
          {section.groupNumber && <span className="epc-group-num">{section.groupNumber}</span>}
          <span className="epc-group-name">{tSection(section)}</span>
        </h3>
        <ul className="epc-sub-list">
          {section.subsections.map(sub => {
            const count = countInSubsection(sub.id);
            return (
              <li key={sub.id}>
                <button
                  className={`epc-sub-item ${count === 0 ? 'epc-sub-item-empty' : ''}`}
                  onClick={() => onSubsectionClick(section.id, sub.id)}
                >
                  <span className="epc-sub-name">{tSub(sub)}</span>
                  {count > 0
                    ? <span className="epc-sub-count" style={{ background: accentColor }}>{count}</span>
                    : <span className="epc-sub-dash">—</span>
                  }
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ── EpcCard (product card in parts view) ─────────────────────────────────────
function EpcCard({ product, onAddToCart, accentColor, lang, t }: {
  product: Product;
  onAddToCart: () => void;
  accentColor?: string;
  lang: string;
  t: TFn;
}) {
  const displayName = lang === 'ka' ? product.nameGe : product.name;
  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.floor(product.rating) ? 'star-on' : 'star-off'}>★</span>
  ));

  return (
    <div className="epc-card">
      <Link to={`/products/${product.id}`} className="epc-card-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {!product.inStock && <div className="epc-card-oos">{t('prod_out_of_stock')}</div>}
        {product.badge && (
          <span className={`badge badge-${product.badge} epc-card-badge`}>{itemStatusLabel(product.badge, lang)}</span>
        )}
      </Link>
      <div className="epc-card-body">
        <p className="epc-card-pn">#{product.partNumber}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="epc-card-name">{displayName}</h3>
        </Link>
        <p className="epc-card-desc">{product.description}</p>
        <div className="epc-card-rating">
          <div style={{ fontSize: 12 }}>{stars}</div>
          <span className="epc-card-reviews">({product.reviews})</span>
        </div>
        <div className="epc-card-footer">
          <span className="epc-card-price">{product.price.toLocaleString()} ₾</span>
          <button
            className="btn-primary epc-add-btn"
            style={product.inStock && accentColor ? { background: accentColor } as React.CSSProperties : {}}
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
