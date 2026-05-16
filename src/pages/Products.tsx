import { useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useVehicle } from '../context/VehicleContext';
import { useCart } from '../context/CartContext';
import { filterByVehicle } from '../data/products';
import { MODELS } from '../data/vehicles';
import { CATALOG } from '../data/catalog';
import { Product } from '../types';
import './Products.css';

export default function Products() {
  const { vehicle } = useVehicle();
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [activeSectionId, setActiveSectionId] = useState('all');

  if (!vehicle) return <Navigate to="/" replace />;

  const model = MODELS.find(m => m.id === vehicle.modelId);
  const vehicleParts = filterByVehicle(vehicle.modelId, vehicle.year);

  const filtered = useMemo(() => {
    let list = [...vehicleParts];

    if (activeSectionId !== 'all') {
      list = list.filter(p => p.sectionId === activeSectionId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.partNumber.toLowerCase().includes(q)
      );
    }

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [vehicleParts, activeSectionId, search, sort]);

  return (
    <main className="products-page">
      <div className="container">
        <div className="products-header">
          <div>
            <h1 className="products-title">All Parts</h1>
            <p className="products-count">
              {filtered.length} of {vehicleParts.length} parts for{' '}
              <span style={{ color: model?.color, fontWeight: 700 }}>
                {model?.name} {vehicle.year}
              </span>
            </p>
          </div>
          <div className="products-controls">
            <input
              className="search-input"
              type="text"
              placeholder="Search by name or part #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="sort-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="products-layout">
          <aside className="sidebar">
            <h3 className="sidebar-title">Section</h3>
            <nav className="category-nav">
              <button
                className={`cat-btn ${activeSectionId === 'all' ? 'cat-btn-active' : ''}`}
                onClick={() => setActiveSectionId('all')}
              >
                <span>⚡</span><span>All Sections</span>
              </button>
              {CATALOG.map(section => {
                const count = vehicleParts.filter(p => p.sectionId === section.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={section.id}
                    className={`cat-btn ${activeSectionId === section.id ? 'cat-btn-active' : ''}`}
                    onClick={() => setActiveSectionId(section.id)}
                  >
                    <span>{section.icon}</span>
                    <span>{section.name}</span>
                    <span className="cat-btn-count">{count}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="products-grid-wrap">
            {filtered.length === 0 ? (
              <div className="no-results">
                <p>No parts found</p>
                <button className="btn-secondary" onClick={() => { setSearch(''); setActiveSectionId('all'); }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="products-grid-main">
                {filtered.map(p => (
                  <ShopCard key={p.id} product={p} onAdd={() => addToCart(p)} modelColor={model?.color} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ShopCard({ product, onAdd, modelColor }: { product: Product; onAdd: () => void; modelColor?: string }) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < Math.floor(product.rating) ? '#f5a623' : 'var(--border)' }}>★</span>
  ));

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className={`badge badge-${product.badge} product-badge`}>{product.badge}</span>}
        {!product.inStock && <div className="out-of-stock-overlay">Out of Stock</div>}
      </Link>
      <div className="product-card-body">
        <p style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>#{product.partNumber}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <div className="product-rating">
          <div className="stars" style={{ fontSize: 12 }}>{stars}</div>
          <span className="rating-count">({product.reviews})</span>
        </div>
        <div className="product-footer">
          <span className="product-price">{product.price.toLocaleString()} ₾</span>
          <button
            className="add-to-cart-btn btn-primary"
            disabled={!product.inStock}
            onClick={onAdd}
            style={product.inStock && modelColor ? { background: modelColor } as React.CSSProperties : {}}
          >
            {product.inStock ? 'Add' : 'N/A'}
          </button>
        </div>
      </div>
    </div>
  );
}
