import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ModelsProvider } from './context/ModelsContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { CatalogProvider } from './context/CatalogContext';
import { ProductsProvider } from './context/ProductsContext';
import { CartProvider } from './context/CartContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <LanguageProvider>
        <ModelsProvider>
          <SiteSettingsProvider>
            <CatalogProvider>
              <ProductsProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </ProductsProvider>
            </CatalogProvider>
          </SiteSettingsProvider>
        </ModelsProvider>
      </LanguageProvider>
    </HashRouter>
  </StrictMode>
);
