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
              <p>Vazha-Pshavela Ave 37<br />Tbilisi, 0177, Georgia</p>
              <p className="contact-sub">Mon–Sat: 10:00–19:00</p>
            </div>
            <div className="contact-card">
              <span className="contact-icon">📞</span>
              <h3>Call Us</h3>
              <a href="tel:+995322001234">+995 32 200 12 34</a>
              <a href="tel:+995599001234">+995 599 00 12 34</a>
              <p className="contact-sub">Mon–Sat: 09:00–20:00</p>
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
