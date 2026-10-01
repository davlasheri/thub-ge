import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'https://teslahub.ge';

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
//
// Pass { noindex: true } on "not found" views: they get
// <meta name="robots" content="noindex"> and no self-canonical, so Google does
// not index soft-404 pages. Real pages remove that tag again.
export function usePageMeta(
  title: string,
  description?: string,
  image?: string,
  opts?: { noindex?: boolean },
) {
  const { pathname } = useLocation();
  const noindex = !!opts?.noindex;

  useEffect(() => {
    const fullTitle = title ? `${title} | TeslaHub.ge` : 'TeslaHub.ge — Tesla-ს ნაწილები საქართველოში';
    document.title = fullTitle;
    const url = SITE + (pathname === '/' ? '/' : pathname);

    if (description) upsertMeta('name', 'description', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const robots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      upsertMeta('name', 'robots', 'noindex');
      canonical?.remove();
    } else {
      robots?.remove();
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }

    // keep social preview tags in sync with the current page
    upsertMeta('property', 'og:title', title || 'TeslaHub.ge — Tesla Parts Georgia');
    upsertMeta('property', 'og:url', url);
    if (description) {
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }
    const ogImage = absoluteImageUrl(image);
    if (ogImage) {
      upsertMeta('property', 'og:image', ogImage);
      upsertMeta('name', 'twitter:card', 'summary_large_image');
    }
  }, [title, description, image, pathname, noindex]);
}

// Absolute URL for an image used in meta tags / JSON-LD. Inline data: and
// blob: images (e.g. a photo pasted in the admin but not uploaded) cannot be
// turned into a URL, so they are skipped (undefined) instead of producing a
// broken "https://teslahub.ge/data:image/…" address.
export function absoluteImageUrl(image?: string): string | undefined {
  if (!image) return undefined;
  if (/^(data|blob):/i.test(image)) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('//')) return 'https:' + image;
  return SITE + (image.startsWith('/') ? image : '/' + image);
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
