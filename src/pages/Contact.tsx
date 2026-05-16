import './Contact.css';

export default function Contact() {
  return (
    <main className="contact-page">
      <div className="container">
        <div className="contact-hero">
          <h1>Get in Touch</h1>
          <p>We're here to help. Contact us by phone, email, or visit our showroom in Tbilisi.</p>
        </div>

        <div className="contact-grid">
          {/* Contact Info */}
          <div className="contact-info">
            <div className="contact-card">
              <span className="contact-icon">📍</span>
              <h3>Visit Us</h3>
              <p>Tbilisi, Georgia</p>
              <p className="contact-sub">Mon–Fri: 10:00–19:00</p>
              <p className="contact-sub">Sat–Sun: 10:00–18:00</p>
              <a
                href="https://maps.app.goo.gl/3Mwx3WmQCfhRRTcb8"
                target="_blank"
                rel="noopener noreferrer"
                className="maps-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                Open in Google Maps
              </a>
            </div>
            <div className="contact-card">
              <span className="contact-icon">📞</span>
              <h3>Call Us</h3>
              <a href="tel:+995599286244">+995 599 286 244</a>
              <p className="contact-sub">Mon–Fri: 10:00–19:00</p>
              <p className="contact-sub">Sat–Sun: 10:00–18:00</p>
            </div>
            <div className="contact-card">
              <span className="contact-icon">✉️</span>
              <h3>Email Us</h3>
              <a href="mailto:info@thub.ge">info@thub.ge</a>
              <a href="mailto:orders@thub.ge">orders@thub.ge</a>
              <p className="contact-sub">Response within 2 hours</p>
            </div>
          </div>

          {/* Contact Form */}
          <form className="contact-form" onSubmit={e => { e.preventDefault(); alert('Message sent! We will reply within 2 hours.'); }}>
            <h2>Send a Message</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input id="name" type="text" placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input id="phone" type="tel" placeholder="+995 5XX XXX XXX" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="your@email.com" required />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select id="subject">
                <option>Product Inquiry</option>
                <option>Order Status</option>
                <option>Installation Help</option>
                <option>Returns & Refunds</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" rows={5} placeholder="How can we help you?" required />
            </div>

            <button type="submit" className="btn-primary contact-submit">
              Send Message
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
