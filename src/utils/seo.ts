import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'https://thub.ge';

// Sets the document title, meta description and canonical URL per page.
// Google renders JS, so client-side meta works for indexing.
export function usePageMeta(title: string, description?: string) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title ? `${title} | THub.ge` : 'THub.ge — Tesla-ს ნაწილები საქართველოში';

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = SITE + (pathname === '/' ? '/' : pathname);
  }, [title, description, pathname]);
}
