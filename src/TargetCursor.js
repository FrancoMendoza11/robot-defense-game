import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './TargetCursor.css';

const TargetCursor = () => {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    if (!cursorRef.current) return;

    // Oculta el cursor predeterminado
    document.body.style.cursor = 'none';

    // Animación de rotación constante
    gsap.to(cursorRef.current, {
      rotation: 360,
      duration: 2,
      repeat: -1,
      ease: 'none'
    });

    // Seguimiento del mouse
    const moveCursor = (e) => {
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power3.out'
      });
    };

    // Efecto al hacer click
    const onMouseDown = () => {
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.1 });
    };
    
    const onMouseUp = () => {
      gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div 
      ref={cursorRef}
      className="target-cursor-wrapper"
    >
      <div ref={dotRef} className="target-cursor-dot" />
      <div className="target-cursor-corner corner-tl" />
      <div className="target-cursor-corner corner-tr" />
      <div className="target-cursor-corner corner-br" />
      <div className="target-cursor-corner corner-bl" />
    </div>
  );
};

export default TargetCursor;