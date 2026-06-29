import React, { useEffect, useState } from 'react';

export default function Celebration() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generated = [];
    const colors = [
      '#d4af37', // Gold
      '#f3e5ab', // Champagne
      '#c0c0c0', // Silver
      '#e5a93b', // Deep Gold
      '#ffffff', // Sparkle white
      '#b87333', // Copper
      '#ff8a80', // Coral
      '#80d8ff'  // Ice Blue
    ];

    const shapes = ['rect', 'circle', 'triangle'];

    // Generate 45 particles for left side, 45 particles for right side
    for (let i = 0; i < 45; i++) {
      // Left side particles
      const leftBurstX = Math.random() * 40 + 10; // 10vw to 50vw
      const leftBurstY = Math.random() * 50 + 40; // 40vh to 90vh
      const leftDriftX = Math.random() * 20 - 5;  // -5vw to 15vw drift
      
      generated.push({
        id: `left-${i}`,
        side: 'left',
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        delay: Math.random() * 0.4, // Stagger start times up to 400ms
        style: {
          '--burst-x': `${leftBurstX}vw`,
          '--burst-y': `${leftBurstY}vh`,
          '--drift-x': `${leftDriftX}vw`,
          '--rotate-mid': `${Math.random() * 180 + 90}deg`,
          '--rotate-max': `${Math.random() * 1080 + 360}deg`,
          width: `${Math.random() * 8 + 6}px`,
          height: `${Math.random() * 12 + 6}px`
        }
      });

      // Right side particles
      const rightBurstX = Math.random() * 40 + 10; // 10vw to 50vw
      const rightBurstY = Math.random() * 50 + 40; // 40vh to 90vh
      const rightDriftX = Math.random() * 20 - 5;  // -5vw to 15vw drift

      generated.push({
        id: `right-${i}`,
        side: 'right',
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        delay: Math.random() * 0.4, // Stagger start times up to 400ms
        style: {
          '--burst-x': `${rightBurstX}vw`,
          '--burst-y': `${rightBurstY}vh`,
          '--drift-x': `${rightDriftX}vw`,
          '--rotate-mid': `${Math.random() * -180 - 90}deg`,
          '--rotate-max': `${Math.random() * -1080 - 360}deg`,
          width: `${Math.random() * 8 + 6}px`,
          height: `${Math.random() * 12 + 6}px`
        }
      });
    }

    setParticles(generated);
  }, []);

  return (
    <div className="celebration-container">
      {particles.map((p) => {
        let shapeStyle = {};
        if (p.shape === 'circle') {
          shapeStyle.borderRadius = '50%';
        } else if (p.shape === 'triangle') {
          shapeStyle.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        }

        return (
          <div
            key={p.id}
            className={`confetti-particle confetti-${p.side}`}
            style={{
              ...p.style,
              ...shapeStyle,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`
            }}
          />
        );
      })}
    </div>
  );
}
