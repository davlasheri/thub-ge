import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ModelsProvider } from './context/ModelsContext';
import { GenerationsProvider } from './context/GenerationsContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { CatalogProvider } from './context/CatalogContext';
import { ProductsProvider } from './context/ProductsContext';
import { CartProvider } from './context/CartContext';
import { CarsProvider } from './context/CarsContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <LanguageProvider>
          <ModelsProvider>
           <GenerationsProvider>
            <SiteSettingsProvider>
              <CatalogProvider>
                <ProductsProvider>
                  <CartProvider>
                    <CarsProvider>
                      <App />
                    </CarsProvider>
                  </CartProvider>
                </ProductsProvider>
              </CatalogProvider>
            </SiteSettingsProvider>
           </GenerationsProvider>
          </ModelsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
