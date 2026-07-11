import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { VehicleProvider } from './context/VehicleContext';
import { useLang } from './context/LanguageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import ImageTool from './pages/ImageTool';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import Service from './pages/Service';
import Staff from './pages/Staff';

function NotFound() {
  const { t } = useLang();
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 48, fontWeight: 900 }}>404</h2>
      <p style={{ color: 'var(--text-muted)' }}>{t('notfound_text')}</p>
      <Link to="/" className="btn-primary">{t('notfound_home')}</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="/pos" element={<Staff />} />
      <Route path="/staff" element={<Navigate to="/pos" replace />} />
      <Route path="/image-tool" element={<ImageTool />} />
      <Route path="*" element={
        <VehicleProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            {/* legacy vehicle-filtered list is retired — /catalog is the shop */}
            <Route path="/products" element={<Navigate to="/catalog" replace />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/cars/:id" element={<CarDetail />} />
            <Route path="/service" element={<Service />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </VehicleProvider>
      } />
    </Routes>
  );
}
