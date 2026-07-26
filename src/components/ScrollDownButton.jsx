import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ScrollDownButton({ targetId = 'home-intro' }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < window.innerHeight * 0.55);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button
      type="button"
      className={`hero-scroll-down${isVisible ? ' is-visible' : ''}`}
      onClick={handleClick}
      aria-label="Scroll down to explore"
    >
      <span className="hero-scroll-down-ring" aria-hidden="true" />
      <span className="hero-scroll-down-inner">
        <span className="hero-scroll-down-label">Scroll</span>
        <ChevronDown size={22} className="hero-scroll-down-icon" />
      </span>
    </button>
  );
}
