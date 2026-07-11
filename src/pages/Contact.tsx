import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import './Contact.css';
import { usePageMeta } from '../utils/seo';

export default function Contact() {
  usePageMeta('კონტაქტი', 'დაგვიკავშირდით: +995 599 286 244, info@thub.ge — Tesla ნაწილები და სერვისი თბილისში.');
  const { t } = useLang();
  const { settings } = useSiteSettings();
  const c = settings.contact;

  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const waNumber = c.phone.replace(/\D/g, '') || '995599286244';

  // No mail backend on the hosting — deliver the inquiry over WhatsApp, the
  // same channel used for orders, so nothing is silently lost.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = form.subject || t('contact_subj_inquiry');
    const lines = [
      `📩 ${t('contact_form_title')} — THub.ge`,
      `${t('contact_name')}: ${form.name}`,
      `${t('contact_phone')}: ${form.phone}`,
      form.email ? `${t('contact_email_label')}: ${form.email}` : '',
      `${t('contact_subject')}: ${subject}`,
      `${t('contact_message')}: ${form.message}`,
    ].filter(Boolean);
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
    setSent(true);
  };

  return (
    <main className="contact-page">
      <div className="container">
        <div className="contact-hero">
          <h1>{t('contact_title')}</h1>
          <p>{t('contact_sub')}</p>
        </div>

        <div className="contact-grid">
          {/* Contact Info */}
          <div className="contact-info">
            <div className="contact-card">
              <span className="contact-icon">📍</span>
              <h3>{t('contact_visit')}</h3>
              <p>{c.address}</p>
              <p className="contact-sub">{c.hoursWeekday}</p>
              <p className="contact-sub">{c.hoursWeekend}</p>
              <a
                href={c.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="maps-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                {t('contact_maps_btn')}
              </a>
            </div>
            <div className="contact-card">
              <span className="contact-icon">📞</span>
              <h3>{t('contact_call')}</h3>
              <a href={c.phoneHref}>{c.phone}</a>
              <p className="contact-sub">{c.hoursWeekday}</p>
              <p className="contact-sub">{c.hoursWeekend}</p>
            </div>
            <div className="contact-card">
              <span className="contact-icon">✉️</span>
              <h3>{t('contact_email_title')}</h3>
              <a href={`mailto:${c.email1}`}>{c.email1}</a>
              <a href={`mailto:${c.email2}`}>{c.email2}</a>
              <p className="contact-sub">{t('contact_email_response')}</p>
            </div>
          </div>

          {/* Contact Form */}
          {sent ? (
            <div className="contact-form contact-form-sent">
              <div className="cart-empty-icon" style={{ fontSize: 48 }}>✅</div>
              <h2>{t('cart_order_sent')}</h2>
              <button type="button" className="btn-primary contact-submit" onClick={() => setSent(false)}>
                {t('contact_send')}
              </button>
            </div>
          ) : (
          <form className="contact-form" onSubmit={submit}>
            <h2>{t('contact_form_title')}</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">{t('contact_name')}</label>
                <input id="name" type="text" placeholder={t('contact_name_ph')} required
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="phone">{t('contact_phone')}</label>
                <input id="phone" type="tel" placeholder="+995 5XX XXX XXX" required
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('contact_email_label')}</label>
              <input id="email" type="email" placeholder="your@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="subject">{t('contact_subject')}</label>
              <select id="subject" value={form.subject} onChange={e => set('subject', e.target.value)}>
                <option>{t('contact_subj_inquiry')}</option>
                <option>{t('contact_subj_order')}</option>
                <option>{t('contact_subj_install')}</option>
                <option>{t('contact_subj_returns')}</option>
                <option>{t('contact_subj_other')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">{t('contact_message')}</label>
              <textarea id="message" rows={5} placeholder={t('contact_message_ph')} required
                value={form.message} onChange={e => set('message', e.target.value)} />
            </div>

            <button type="submit" className="btn-primary contact-submit">
              {t('contact_send')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
          )}
        </div>
      </div>
    </main>
  );
}
