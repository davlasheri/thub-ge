import { Routes, Route } from 'react-router-dom';
import { VehicleProvider } from './context/VehicleContext';
import Header from './components/Header';
import VehicleBar from './components/VehicleBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';

export default function App() {
  return (
    <VehicleProvider>
      <Header />
      <VehicleBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 48, fontWeight: 900 }}>404</h2>
            <p style={{ color: 'var(--text-muted)' }}>Page not found</p>
            <a href="/" className="btn-primary">Go Home</a>
          </div>
        } />
      </Routes>
      <Footer />
    </VehicleProvider>
  );
}
