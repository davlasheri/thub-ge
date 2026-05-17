import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { generateOrderPdf } from '../utils/orderPdf';
import './CartDrawer.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: Props) {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { t } = useLang();
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const canDownload = phone.trim().length >= 9 && termsAccepted;

  function handleDownload() {
    if (phone.trim().length < 9) {
      setPhoneError(true);
      return;
    }
    generateOrderPdf(items, phone.trim(), totalPrice);
  }

  return (
    <>
      <div
        className={`cart-overlay ${isOpen ? 'cart-overlay-open' : ''}`}
        onClick={onClose}
      />
      <aside className={`cart-drawer ${isOpen ? 'cart-drawer-open' : ''}`}>
        <div className="cart-header">
          <h2>{t('cart_title')}</h2>
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
            <p>{t('cart_empty')}</p>
            <button className="btn-primary" onClick={onClose}>{t('cart_continue')}</button>
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
                <span>{t('cart_total')}</span>
                <span>{totalPrice.toLocaleString()} ₾</span>
              </div>

              <div className="cart-checkout-form">
                <div className={`cart-phone-field${phoneError ? ' cart-phone-error' : ''}`}>
                  <label className="cart-phone-label">{t('checkout_phone')}</label>
                  <input
                    type="tel"
                    className="cart-phone-input"
                    placeholder={t('checkout_phone_ph')}
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      setPhoneError(false);
                    }}
                  />
                  {phoneError && (
                    <span className="cart-phone-err-msg">{t('checkout_phone_err')}</span>
                  )}
                </div>

                <label className="cart-terms-label">
                  <input
                    type="checkbox"
                    className="cart-terms-checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    {t('checkout_terms')}{' '}
                    <a href="#" className="cart-terms-link" onClick={e => e.preventDefault()}>
                      {t('checkout_terms_link')}
                    </a>
                  </span>
                </label>
              </div>

              <button
                className="btn-primary cart-download-btn"
                onClick={handleDownload}
                disabled={!canDownload}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('checkout_download')}
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                onClick={clearCart}
              >
                {t('cart_clear')}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
