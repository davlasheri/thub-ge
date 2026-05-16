import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart();

  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}>★</span>
  ));

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && (
          <span className={`badge badge-${product.badge} product-badge`}>
            {product.badge}
          </span>
        )}
        {!product.inStock && (
          <div className="out-of-stock-overlay">Out of Stock</div>
        )}
      </Link>

      <div className="product-card-body">
        <div className="product-compat">
          {product.compatibility.slice(0, 2).map(c => (
            <span key={c} className="compat-tag">{c}</span>
          ))}
        </div>

        <Link to={`/products/${product.id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>

        <div className="product-rating">
          <div className="stars">{stars}</div>
          <span className="rating-count">({product.reviews})</span>
        </div>

        <div className="product-footer">
          <span className="product-price">{product.price.toLocaleString()} ₾</span>
          <button
            className="btn-primary add-to-cart-btn"
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
          >
            {product.inStock ? 'Add to Cart' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}
