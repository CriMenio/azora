import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://azorasalon.com'; // Change to production domain if different

export default function SeoMeta({
  title = 'Azora Salon & Spa | Premium Hair, Beauty & Grooming in Kamothe, Navi Mumbai',
  description = 'Experience premium grooming, hair spa, balayage coloring, and rejuvenating beauty treatments at Azora Salon & Spa in Kamothe, Navi Mumbai. Book your experience today.',
  canonicalPath,
  noindex = false,
}) {
  const location = useLocation();
  const currentPath = canonicalPath || location.pathname;

  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // 2. Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${SITE_URL}${currentPath === '/' ? '' : currentPath}`);

    // 4. Update Robots Meta (for admin or private screens)
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else if (metaRobots) {
      metaRobots.setAttribute('content', 'index, follow');
    }

    // 5. Update OpenGraph Tags
    const setOgTag = (property, content) => {
      let og = document.querySelector(`meta[property="${property}"]`);
      if (!og) {
        og = document.createElement('meta');
        og.setAttribute('property', property);
        document.head.appendChild(og);
      }
      og.setAttribute('content', content);
    };

    setOgTag('og:title', title);
    setOgTag('og:description', description);
    setOgTag('og:url', `${SITE_URL}${currentPath}`);
  }, [title, description, currentPath, noindex]);

  return null;
}
