import React, { useEffect, useState } from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';

export default function ScrollNavButtons() {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const footer = document.getElementById('site-footer');

      // Show Up button whenever user has scrolled down into the page
      const canScrollUp = scrollY > 200;

      // Check if user is near the footer/bottom of the page
      const nearFooter = footer
        ? scrollY + windowHeight >= footer.offsetTop - 100
        : scrollY + windowHeight >= documentHeight - 120;

      // Show Down button when not near footer and page has more content below
      const pageHasScrollableContent = documentHeight > windowHeight + 150;
      const canScrollDown = !nearFooter && pageHasScrollableContent && (scrollY > 150 || documentHeight > windowHeight * 1.4);

      setShowUp(canScrollUp);
      setShowDown(canScrollDown);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const footer = document.getElementById('site-footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="scroll-nav-group" aria-label="Page navigation">
      {/* Up Navigation Button */}
      <button
        id="scroll-to-top-btn"
        type="button"
        className={`scroll-nav-btn scroll-nav-btn--up${showUp ? ' is-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top of page"
        title="Scroll to top"
        tabIndex={showUp ? 0 : -1}
      >
        <span className="scroll-nav-glow" aria-hidden="true" />
        <ChevronsUp size={22} className="scroll-nav-icon scroll-nav-icon--up" />
      </button>

      {/* Down Navigation Button */}
      <button
        id="scroll-to-bottom-btn"
        type="button"
        className={`scroll-nav-btn scroll-nav-btn--down${showDown ? ' is-visible' : ''}`}
        onClick={scrollToBottom}
        aria-label="Scroll to bottom of page"
        title="Scroll to bottom / footer"
        tabIndex={showDown ? 0 : -1}
      >
        <span className="scroll-nav-glow" aria-hidden="true" />
        <ChevronsDown size={22} className="scroll-nav-icon scroll-nav-icon--down" />
      </button>
    </div>
  );
}

// Named alias export for backward compatibility
export { ScrollNavButtons as ScrollToFooter };

