/**
 * StatCard Component (src/components/StatCard.jsx)
 *
 * Animated KPI metric card with:
 * - Icon
 * - Animated counter (counts up on mount)
 * - Label + optional trend arrow
 * - Accent colour top-border
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Count-up animation hook.
 * @param {number} target   Final number to count to
 * @param {number} duration ms for animation
 */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) return;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

/**
 * @param {{
 *   icon:    string,
 *   value:   string|number,
 *   label:   string,
 *   color?:  string,   CSS color for value text
 *   prefix?: string,
 *   suffix?: string,
 *   animate?: boolean, animate numeric values
 *   delay?:  number,   entrance animation delay (s)
 * }} props
 */
export default function StatCard({
  icon,
  value,
  label,
  color = 'var(--primary-light)',
  prefix = '',
  suffix = '',
  animate = true,
  delay = 0,
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric    = !isNaN(numericValue) && animate;
  const animatedNum  = useCountUp(isNumeric ? numericValue : 0);

  const displayValue = isNumeric
    ? `${prefix}${Number.isInteger(numericValue) ? Math.round(animatedNum) : animatedNum.toFixed(1)}${suffix}`
    : `${prefix}${value}${suffix}`;

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ '--accent-color': color }}
    >
      {/* Top accent line uses the accent colour */}
      <style>{`.stat-card::before { background: ${color} !important; }`}</style>

      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__value" style={{ color }}>
        {displayValue}
      </div>
      <div className="stat-card__label">{label}</div>
    </motion.div>
  );
}
