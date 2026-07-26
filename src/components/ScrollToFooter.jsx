import React, { useEffect, useState } from 'react';
import { ChevronsDown } from 'lucide-react';

export default function ScrollToFooter() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.getElementById('site-footer');
      const scrollY = window.scrollY;
      const nearFooter = footer
        ? scrollY + window.innerHeight >= footer.offsetTop - 120
        : false;

      setIsVisible(scrollY > 280 && !nearFooter);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToFooter = () => {
    const footer = document.getElementById('site-footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button
      type="button"
      className={`scroll-to-footer${isVisible ? ' is-visible' : ''}`}
      onClick={scrollToFooter}
      aria-label="Scroll to footer"
      title="Go to footer"
    >
      <span className="scroll-to-footer-glow" aria-hidden="true" />
      <ChevronsDown size={22} className="scroll-to-footer-icon" />
    </button>
  );
}
