import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { products, categories } from '../data/products';
import './Products.css';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const activeCategory = searchParams.get('category') || 'all';

  const setCategory = (id: string) => {
    if (id === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: id });
    }
  };

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.compatibility.some(c => c.toLowerCase().includes(q))
      );
    }

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [activeCategory, search, sort]);

  return (
    <main className="products-page">
      <div className="container">
        <div className="products-header">
          <div>
            <h1 className="products-title">Shop Tesla Parts</h1>
            <p className="products-count">{filtered.length} products</p>
          </div>
          <div className="products-controls">
            <input
              className="search-input"
              type="text"
              placeholder="Search parts, models..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="sort-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="products-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <h3 className="sidebar-title">Category</h3>
            <nav className="category-nav">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-btn ${activeCategory === cat.id ? 'cat-btn-active' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </nav>

            <div className="sidebar-section">
              <h3 className="sidebar-title">Availability</h3>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked /> In Stock Only
              </label>
            </div>
          </aside>

          {/* Grid */}
          <div className="products-grid-wrap">
            {filtered.length === 0 ? (
              <div className="no-results">
                <p>No products found</p>
                <button className="btn-secondary" onClick={() => { setSearch(''); setCategory('all'); }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="products-grid-main">
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
