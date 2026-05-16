import { useCart } from '../context/CartContext';
import './CartDrawer.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: Props) {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  return (
    <>
      <div
        className={`cart-overlay ${isOpen ? 'cart-overlay-open' : ''}`}
        onClick={onClose}
      />
      <aside className={`cart-drawer ${isOpen ? 'cart-drawer-open' : ''}`}>
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="cart-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <p>Your cart is empty</p>
            <button className="btn-primary" onClick={onClose}>Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(item => (
                <div key={item.product.id} className="cart-item">
                  <img src={item.product.image} alt={item.product.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.product.name}</p>
                    <p className="cart-item-price">{item.product.price.toLocaleString()} ₾</p>
                    <div className="cart-item-qty">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.product.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span>{totalPrice.toLocaleString()} ₾</span>
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Proceed to Checkout
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
