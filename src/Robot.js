import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import robotImage from './assets/robot.png';

const Robot = ({ id, lane, health, onDamage, onReachBase, gameAreaRef }) => {
  const robotRef = useRef(null);
  const damageAmount = 20;

  useEffect(() => {
    if (!robotRef.current || !gameAreaRef.current) return;

    const area = gameAreaRef.current.getBoundingClientRect();

    // Función para convertir porcentajes a píxeles
    const parsePosition = (pos, isWidth) => {
      if (typeof pos === 'string' && pos.includes('%')) {
        const percent = parseFloat(pos) / 100;
        return isWidth ? area.width * percent : area.height * percent;
      }
      return parseFloat(pos);
    };

    // Convertimos las posiciones del carril
    const startX = parsePosition(lane.start.x, true);
    const startY = parsePosition(lane.start.y, false);
    const endX = parsePosition(lane.end.x, true);
    const endY = parsePosition(lane.end.y, false);

    // Configuración inicial precisa
    gsap.set(robotRef.current, {
      x: startX,
      y: startY,
      opacity: 1,
      scale: 1
    });

    // Movimiento lineal directo sin rebote
    const movement = gsap.to(robotRef.current, {
      x: endX,
      y: endY,
      duration: 5, // 5 segundos de viaje
      ease: "none", // Movimiento completamente lineal
      onComplete: () => {
        // Eliminamos el robot al llegar
        onReachBase(id);
      },
      // Eliminamos cualquier modificador que pueda causar rebote
      modifiers: {}
    });

    // Limpieza al desmontar
    return () => {
      movement.kill();
    };
  }, [id, lane, onReachBase, gameAreaRef]);

  const handleClick = (e) => {
    e.stopPropagation();
    onDamage(id, damageAmount);
    
    // Animación de daño (sin afectar posición)
    gsap.to(robotRef.current, {
      scale: 0.8,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  };

  return (
    <div 
      ref={robotRef}
      style={{
        position: 'absolute',
        width: '100px',
        height: '100px',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        pointerEvents: 'auto'
      }}
      onClick={handleClick}
    >
      <img
        src={robotImage}
        alt="Robot"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))'
        }}
      />
      
      {/* Barra de salud */}
      <div style={{
        position: 'absolute',
        bottom: '-15px',
        left: '10%',
        width: '80%',
        height: '6px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${health}%`,
          height: '100%',
          backgroundColor: health > 50 ? '#00FF00' : '#FF0000',
          transition: 'width 0.2s ease-out'
        }} />
      </div>
    </div>
  );
};

export default Robot;