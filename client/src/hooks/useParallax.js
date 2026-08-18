import { useEffect } from 'react';
import { isMobile, prefersReducedMotion } from '../lib/utils';

export function useParallax(containerRef) {
  useEffect(() => {
    if (isMobile() || prefersReducedMotion() || !containerRef.current) return;

    const el = containerRef.current;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const mouseX = (clientX / innerWidth - 0.5) * 30; // max deg
      const mouseY = (clientY / innerHeight - 0.5) * 30;

      requestAnimationFrame(() => {
        el.style.setProperty('--mouse-x', `${mouseX}px`);
        el.style.setProperty('--mouse-y', `${mouseY}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [containerRef]);
}

export default useParallax;
