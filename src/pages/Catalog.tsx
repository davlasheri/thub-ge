import { useState, useMemo, useRef, useEffect } from 'react';
import { Link , useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { itemStatusLabel } from '../utils/itemStatus';
import { useProducts } from '../context/ProductsContext';
import { useCatalog } from '../context/CatalogContext';
import { useModels } from '../context/ModelsContext';
import { getCatName } from '../utils/catalog';
import { TeslaModel, CatalogSection, Product } from '../types';
import { Generation } from '../data/generations';
import { useGenerations } from '../context/GenerationsContext';
import { TranslationKey } from '../data/translations';
import ModelBlueprint from '../components/ModelBlueprint';
import { sectionArt } from '../utils/partArt';
import './Catalog.css';
import { usePageMeta } from '../utils/seo';

type TFn = (k: TranslationKey) => string;

type EpcView = 'models' | 'groups' | 'parts';

// ── Silhouettes ───────────────────────────────────────────────────────────────
function ModelSilhouette({ modelId }: { modelId: string; tall?: boolean }) {
  return <ModelBlueprint modelId={modelId} />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Catalog() {
  usePageMeta('კატალოგი — Tesla EPC ჯგუფები', 'Tesla-ს ნაწილების კატალოგი ოფიციალური ჯგუფებით: ძარა, სავარძლები, ბატარეა, სამუხრუჭე სისტემა და სხვა.');
  const { addToCart } = useCart();
  const { t, lang } = useLang();
  const { visibleProducts: products } = useProducts();
  const { catalog } = useCatalog();
  const { models } = useModels();
  const { getGenerations } = useGenerations();

  const [view, setView] = useState<EpcView>('models');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [yearModalModelId, setYearModalModelId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeSubsectionId, setActiveSubsectionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  // section requested by the home page car diagram (?sec=...)
  const pendingSecRef = useRef<string | null>(searchParams.get('sec'));
  const pendingModelRef = useRef<string | null>(searchParams.get('model'));

  const selectedModel = models.find(m => m.id === selectedModelId);
  const modalModel    = models.find(m => m.id === yearModalModelId);

  // "all years" pseudo-generation: matches every fit range of the model
  const allYearsGen = (mdl: TeslaModel): Generation => ({
    id: `${mdl.id}-allyears`, from: 0, to: 9999, label: t('epc_all_years'),
  });

  // parts with no ticked models are universal — they fit every car
  const fitsSelection = (p: Product, modelId: string, gen: Generation): boolean => {
    if (Object.keys(p.fits).length === 0) return true;
    const range = p.fits[modelId];
    if (!range) return false;
    return gen.from <= range.to && gen.to >= range.from;
  };

  const selectGeneration = (modelId: string, gen: Generation) => {
    setSelectedModelId(modelId);
    setSelectedGen(gen);
    setYearModalModelId(null);
    setActiveSectionId(null);
    setActiveSubsectionId(null);
    setSearch('');
    setView('groups');
    const sec = pendingSecRef.current;
    if (sec) {
      pendingSecRef.current = null;
      setTimeout(() => {
        const el = document.getElementById('epc-sec-' + sec);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('epc-sec-flash');
          setTimeout(() => el.classList.remove('epc-sec-flash'), 2400);
        }
      }, 200);
    }
  };

  // deep link from the home hero: ?model=MS[&sec=body] → open that model with
  // ALL years (no trim guessing), then the pendingSec scroll runs inside
  // selectGeneration
  useEffect(() => {
    const mid = pendingModelRef.current;
    if (!mid) return;
    pendingModelRef.current = null;
    const mdl = models.find(m => m.id === mid);
    if (!mdl) return;
    selectGeneration(mdl.id, allYearsGen(mdl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models]);

  const openSubsection = (sectionId: string, subsectionId: string) => {
    setActiveSectionId(sectionId);
    setActiveSubsectionId(subsectionId);
    setView('parts');
  };

  const goToGroups = () => { setView('groups'); setActiveSectionId(null); setActiveSubsectionId(null); };
  const goToModels = () => { setView('models'); setSelectedModelId(null); setSelectedGen(null); };

  const countInSubsection = (subsectionId: string): number => {
    if (!selectedModelId || !selectedGen) return 0;
    return products.filter(p =>
      p.subsectionId === subsectionId && fitsSelection(p, selectedModelId, selectedGen)
    ).length;
  };

  const partsForSubsection = useMemo<Product[]>(() => {
    if (!selectedModelId || !selectedGen || !activeSubsectionId) return [];
    return products.filter(p =>
      p.subsectionId === activeSubsectionId && fitsSelection(p, selectedModelId, selectedGen)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModelId, selectedGen, activeSubsectionId, products]);

  // part numbers are stored like "1494822-00-F"; compare ignoring dashes/spaces
  const normalizeCode = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // subsectionId -> part numbers whose code matches the search query
  // (only among products fitting the selected model/generation, so a click
  // on a highlighted category always shows the matched item)
  const codeMatches = useMemo(() => {
    const map = new Map<string, string[]>();
    const q = normalizeCode(search);
    if (q.length < 1 || !selectedModelId || !selectedGen) return map;
    for (const p of products) {
      if (!fitsSelection(p, selectedModelId, selectedGen)) continue;
      if (!normalizeCode(p.partNumber).includes(q)) continue;
      const list = map.get(p.subsectionId) ?? [];
      list.push(p.partNumber);
      map.set(p.subsectionId, list);
    }
    return map;
  }, [search, products, selectedModelId, selectedGen]);

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog
      .map(sec => ({
        ...sec,
        subsections: sec.subsections.filter(sub =>
          getCatName(sub, lang, 'sub').toLowerCase().includes(q) ||
          codeMatches.has(sub.id)
        ),
      }))
      .filter(sec =>
        getCatName(sec, lang, 'section').toLowerCase().includes(q) ||
        sec.subsections.length > 0
      );
  }, [catalog, search, lang, codeMatches]);

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
                  <button
                    className="epc-gen-btn epc-gen-btn-all"
                    style={{ borderColor: modalModel.color, color: modalModel.color }}
                    onClick={() => selectGeneration(modalModel.id, allYearsGen(modalModel))}
                  >
                    ⭐ {t('epc_all_years')} · {modalModel.years.from} – {modalModel.years.to}
                  </button>
                  {getGenerations(modalModel.id, modalModel.name, modalModel.years.from, modalModel.years.to).map(gen => (
                    <button
                      key={gen.id}
                      className="epc-gen-btn"
                      onClick={() => selectGeneration(modalModel.id, gen)}
                    >
                      {gen.label}
                    </button>
                  ))}
                </div>
                <p className="epc-gen-hint">{t('epc_all_years_hint')}</p>
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
                  <div key={section.id} id={'epc-sec-' + section.id}>
                  <GroupCard
                    section={section}
                    tSection={tSection}
                    tSub={tSub}
                    countInSubsection={countInSubsection}
                    onSubsectionClick={openSubsection}
                    accentColor={selectedModel.color}
                    codeMatches={codeMatches}
                  />
                  </div>
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
  section, tSection, tSub, countInSubsection, onSubsectionClick, accentColor, codeMatches,
}: {
  section: CatalogSection;
  tSection: (s: CatalogSection) => string;
  tSub: (s: { id: string; name: string; nameGe?: string }) => string;
  countInSubsection: (id: string) => number;
  onSubsectionClick: (sectionId: string, subId: string) => void;
  accentColor?: string;
  codeMatches: Map<string, string[]>;
}) {
  const hasCodeMatch = section.subsections.some(sub => codeMatches.has(sub.id));
  return (
    <div
      className={`epc-group-card ${hasCodeMatch ? 'epc-group-card-code-match' : ''}`}
      style={hasCodeMatch && accentColor ? { '--epc-match-color': accentColor } as React.CSSProperties : undefined}
    >
      <div className="epc-group-img-wrap">
        <img src={sectionArt(section.id)} alt={tSection(section)} loading="lazy" />
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
            const matchedCodes = codeMatches.get(sub.id);
            return (
              <li key={sub.id}>
                <button
                  className={`epc-sub-item ${count === 0 ? 'epc-sub-item-empty' : ''} ${matchedCodes ? 'epc-sub-item-code-match' : ''}`}
                  onClick={() => onSubsectionClick(section.id, sub.id)}
                >
                  <span className="epc-sub-name">
                    {tSub(sub)}
                    {matchedCodes && (
                      <span className="epc-sub-code-badge" style={{ background: accentColor }}>
                        #{matchedCodes[0]}{matchedCodes.length > 1 ? ` +${matchedCodes.length - 1}` : ''}
                      </span>
                    )}
                  </span>
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
