import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { generateOrderPdf, generateOrderPdfBlob, buildOrderSummary } from '../utils/orderPdf';
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

  async function handleWhatsApp() {
    if (phone.trim().length < 9) {
      setPhoneError(true);
      return;
    }
    const { blob, orderNum } = generateOrderPdfBlob(items, phone.trim(), totalPrice);
    const summary = buildOrderSummary(items, phone.trim(), totalPrice, orderNum);
    const waUrl = `https://wa.me/995599286244?text=${encodeURIComponent(summary)}`;

    if (typeof navigator.canShare === 'function') {
      const file = new File([blob], `thub-order-${orderNum}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'THub.ge Order', text: summary });
          return;
        } catch {
          // user cancelled — fall through to wa.me link
        }
      }
    }
    window.open(waUrl, '_blank');
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

              <div className="cart-action-btns">
                <button
                  className="btn-secondary cart-action-btn"
                  onClick={handleDownload}
                  disabled={!canDownload}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t('checkout_download')}
                </button>
                <button
                  className="btn-whatsapp cart-action-btn"
                  onClick={handleWhatsApp}
                  disabled={!canDownload}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.827L.057 23.944l6.263-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.007-1.373l-.36-.213-3.716.855.884-3.615-.234-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z" />
                  </svg>
                  {t('checkout_whatsapp')}
                </button>
              </div>
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
