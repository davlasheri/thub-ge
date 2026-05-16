import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </HashRouter>
  </StrictMode>
);
