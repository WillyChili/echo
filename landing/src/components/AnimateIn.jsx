import { useRef, useState, useEffect } from 'react';

/**
 * Wraps children and fades them up when they enter the viewport.
 * Uses IntersectionObserver — fires once, then disconnects.
 *
 * Props:
 *   delay   – ms offset before the transition starts (for stagger)
 *   className – forwarded to the wrapper element
 *   as      – HTML tag to render (default: 'div')
 */
export default function AnimateIn({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref     = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          obs.disconnect();
        }
      },
      { threshold: 0.10 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity:    show ? 1 : 0,
        transform:  show ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
