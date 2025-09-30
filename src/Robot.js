import { useEffect, useRef, useState, memo } from 'react';
import { gsap } from 'gsap';
import robotImage from './assets/robot.gif';
import robot2Image from './assets/robot2.gif';

const Robot = memo(({ 
  id, 
  lane, 
  health, 
  maxHealth,
  type,
  onDamage, 
  onReachBase, 
  gameAreaRef, 
  paused,
  shield = 0
}) => {
  const robotRef = useRef(null);
  const movementRef = useRef(null);
  const [stuck, setStuck] = useState(false);
  const [currentShield, setCurrentShield] = useState(shield);
  const [showDamage, setShowDamage] = useState(null);

  const damageAmount = 20;
  
  // Selección de imagen según tipo
  const getImageForType = () => {
    switch(type) {
      case 'tank':
      case 'boss':
        return robot2Image;
      default:
        return robotImage;
    }
  };

  const imgSrc = getImageForType();
  
  // Tamaño según tipo
  const getSizeForType = () => {
    switch(type) {
      case 'boss': return 250;
      case 'tank': return 180;
      case 'shielded': return 150;
      case 'runner': return 100;
      case 'scout': return 120;
      default: return 145;
    }
  };

  const robotSize = getSizeForType();

  // Movimiento GSAP
  useEffect(() => {
    if (!robotRef.current || !gameAreaRef.current) return;

    const area = gameAreaRef.current.getBoundingClientRect();

    const parsePosition = (pos, isWidth) => {
      if (typeof pos === 'string' && pos.includes('%')) {
        const percent = parseFloat(pos) / 100;
        return isWidth ? area.width * percent : area.height * percent;
      }
      return parseFloat(pos);
    };

    const startX = parsePosition(lane.start.x, true);
    const startY = parsePosition(lane.start.y, false);
    const endX = parsePosition(lane.end.x, true);
    const endY = parsePosition(lane.end.y, false);

    gsap.set(robotRef.current, {
      x: startX,
      y: startY,
      opacity: 1,
      scale: 1
    });

    const robotWidth = robotRef.current.offsetWidth;
    const robotHeight = robotRef.current.offsetHeight;

    const finalX = endX - robotWidth / 2;
    const finalY = endY - robotHeight / 2;

    // Velocidad base ajustada por tipo
    const baseSpeed = type === 'runner' ? 6 : type === 'tank' ? 14 : 10;

    movementRef.current = gsap.to(robotRef.current, {
      x: finalX,
      y: finalY,
      duration: baseSpeed,
      ease: "none",
      paused: paused,
      onComplete: () => setStuck(true)
    });

    return () => movementRef.current.kill();
  }, [id, lane, gameAreaRef, type]);

  useEffect(() => {
    if (movementRef.current) {
      paused ? movementRef.current.pause() : movementRef.current.play();
    }
  }, [paused]);

  useEffect(() => {
    if (stuck) {
      onReachBase(id);
    }
  }, [stuck, id, onReachBase]);

  // Daño mejorado con feedback
  const handleClick = (e) => {
    e.stopPropagation();
    
    // Mostrar número de daño
    setShowDamage(damageAmount);
    setTimeout(() => setShowDamage(null), 600);

    // Efecto visual según si hay escudo
    if (currentShield > 0) {
      const newShield = Math.max(0, currentShield - damageAmount);
      setCurrentShield(newShield);
      
      // Flash azul para escudo
      gsap.to(robotRef.current, {
        filter: 'brightness(2) saturate(2) hue-rotate(180deg)',
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });

      if (newShield <= 0) {
        onDamage(id, damageAmount - currentShield);
      }
    } else {
      onDamage(id, damageAmount);
      
      // Shake y flash rojo
      gsap.to(robotRef.current, {
        x: '+=10',
        duration: 0.05,
        yoyo: true,
        repeat: 3
      });
      
      gsap.to(robotRef.current, {
        filter: 'brightness(1.5) saturate(2)',
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    }

    // Efecto de escala
    gsap.to(robotRef.current, {
      scale: 0.85,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });
  };

  const healthPercent = (health / maxHealth) * 100;
  const shieldPercent = shield > 0 ? (currentShield / shield) * 100 : 0;

  return (
    <div
      ref={robotRef}
      className="robot"
      style={{
        position: 'absolute',
        width: `${robotSize}px`,
        height: `${robotSize}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        pointerEvents: 'auto',
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      <img
        src={imgSrc}
        alt="Robot"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: `drop-shadow(0 0 8px ${type === 'boss' ? '#FF00FF' : '#00FF00'})`
        }}
        draggable="false"
      />
      
      {/* Indicador de escudo */}
      {shield > 0 && currentShield > 0 && (
        <div style={{
          position: 'absolute',
          top: '-25px',
          left: '10%',
          width: '80%',
          height: '6px',
          backgroundColor: 'rgba(0, 100, 255, 0.3)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #00FFFF'
        }}>
          <div style={{
            width: `${shieldPercent}%`,
            height: '100%',
            backgroundColor: '#00FFFF',
            transition: 'width 0.2s ease-out',
            boxShadow: '0 0 10px #00FFFF'
          }} />
        </div>
      )}

      {/* Barra de salud */}
      <div style={{
        position: 'absolute',
        bottom: '-15px',
        left: '10%',
        width: '80%',
        height: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid #00FF00'
      }}>
        <div style={{
          width: `${healthPercent}%`,
          height: '100%',
          backgroundColor: healthPercent > 50 ? '#00FF00' : healthPercent > 25 ? '#FFFF00' : '#FF0000',
          transition: 'width 0.2s ease-out, background-color 0.3s',
          boxShadow: `0 0 10px ${healthPercent > 50 ? '#00FF00' : '#FF0000'}`
        }} />
      </div>

      {/* Indicador de tipo */}
      {type === 'boss' && (
        <div style={{
          position: 'absolute',
          top: '-35px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#FF00FF',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '10px',
          textShadow: '0 0 10px #FF00FF',
          whiteSpace: 'nowrap'
        }}>
          ⚠ BOSS ⚠
        </div>
      )}

      {/* Número de daño flotante */}
      {showDamage && (
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: currentShield > 0 ? '#00FFFF' : '#FF0000',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '14px',
          fontWeight: 'bold',
          textShadow: '0 0 10px currentColor',
          animation: 'floatUp 0.6s ease-out',
          pointerEvents: 'none'
        }}>
          -{showDamage}
        </div>
      )}
    </div>
  );
});

export default Robot;