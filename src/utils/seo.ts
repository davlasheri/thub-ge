import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'https://thub.ge';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

// Sets the document title, meta description, canonical URL and social (OG /
// Twitter) tags per page. Google renders JS, so client-side meta works for
// indexing; social scrapers that don't run JS still get the static homepage
// card from index.html, which is an acceptable fallback.
export function usePageMeta(title: string, description?: string, image?: string) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} | THub.ge` : 'THub.ge — Tesla-ს ნაწილები საქართველოში';
    document.title = fullTitle;
    const url = SITE + (pathname === '/' ? '/' : pathname);

    if (description) upsertMeta('name', 'description', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // keep social preview tags in sync with the current page
    upsertMeta('property', 'og:title', title || 'THub.ge — Tesla Parts Georgia');
    upsertMeta('property', 'og:url', url);
    if (description) {
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }
    if (image) {
      upsertMeta('property', 'og:image', image.startsWith('http') ? image : SITE + image);
      upsertMeta('name', 'twitter:card', 'summary_large_image');
    }
  }, [title, description, image, pathname]);
}

// Injects (and cleans up) a single JSON-LD structured-data block for the page,
// e.g. a schema.org/Product so listings are eligible for Google rich results.
export function useJsonLd(data: object | null) {
  const serialized = data ? JSON.stringify(data) : null;
  useEffect(() => {
    if (!serialized) return;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-page-jsonld', '');
    el.textContent = serialized;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [serialized]);
}

export { SITE };
