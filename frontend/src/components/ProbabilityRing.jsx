/**
 * ProbabilityRing Component (src/components/ProbabilityRing.jsx)
 *
 * SVG-based animated circular progress ring to display placement probability.
 * Animates from 0 to the target value on mount.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * @param {{
 *   probability: number,   0–100
 *   size?:       number,   px (default 160)
 *   placed?:     boolean,  true = green, false = orange/red
 * }} props
 */
export default function ProbabilityRing({ probability, size = 160, placed = true }) {
  const [animatedProb, setAnimatedProb] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedProb(probability), 100);
    return () => clearTimeout(timeout);
  }, [probability]);

  const strokeWidth = size * 0.075;
  const radius      = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (animatedProb / 100) * circumference;

  const color      = placed   ? '#22C55E' : '#FF6B35';
  const trackColor = placed   ? 'rgba(34,197,94,0.1)' : 'rgba(255,107,53,0.1)';
  const glowColor  = placed   ? 'rgba(34,197,94,0.4)'  : 'rgba(255,107,53,0.4)';

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        margin: '0 auto',
        filter: `drop-shadow(0 0 12px ${glowColor})`,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
      </svg>

      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
        }}
      >
        <motion.span
          key={animatedProb}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          style={{
            fontSize: size * 0.17 + 'px',
            fontWeight: 900,
            color,
            lineHeight: 1,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {probability.toFixed(1)}%
        </motion.span>
        <span
          style={{
            fontSize: size * 0.09 + 'px',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Probability
        </span>
      </div>
    </div>
  );
}
