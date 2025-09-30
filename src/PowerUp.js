import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const POWERUP_TYPES = {
  HEALTH: {
    color: '#00FF00',
    effect: 'health',
    icon: '❤️',
    value: 30,
    duration: 0
  },
  RAPID_FIRE: {
    color: '#FFFF00',
    effect: 'rapidFire',
    icon: '⚡',
    value: 0,
    duration: 10000
  },
  SHIELD: {
    color: '#00FFFF',
    effect: 'shield',
    icon: '🛡️',
    value: 0,
    duration: 15000
  },
  NUKE: {
    color: '#FF00FF',
    effect: 'nuke',
    icon: '💥',
    value: 0,
    duration: 0
  },
  DOUBLE_POINTS: {
    color: '#FFA500',
    effect: 'doublePoints',
    icon: '⭐',
    value: 0,
    duration: 20000
  }
};

const PowerUp = ({ id, x, y, type, onCollect, gameAreaRef }) => {
  const powerUpRef = useRef(null);
  const [collected, setCollected] = useState(false);
  
  const powerUpData = POWERUP_TYPES[type];

  useEffect(() => {
    if (!powerUpRef.current) return;

    // Animación de aparición
    gsap.fromTo(powerUpRef.current,
      { scale: 0, rotation: 0, opacity: 0 },
      { scale: 1, rotation: 360, opacity: 1, duration: 0.5, ease: 'back.out' }
    );

    // Rotación continua
    gsap.to(powerUpRef.current, {
      rotation: 360,
      duration: 3,
      repeat: -1,
      ease: 'none'
    });

    // Flotación
    gsap.to(powerUpRef.current, {
      y: '-=15',
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Auto-destrucción después de 10 segundos
    const timeout = setTimeout(() => {
      gsap.to(powerUpRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        onComplete: () => onCollect(id, null)
      });
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    if (collected) return;
    
    setCollected(true);

    // Animación de recolección
    gsap.to(powerUpRef.current, {
      scale: 2,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => onCollect(id, type)
    });
  };

  return (
    <div
      ref={powerUpRef}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: powerUpData.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: `0 0 20px ${powerUpData.color}, 0 0 40px ${powerUpData.color}`,
        border: `3px solid white`,
        zIndex: 15,
        pointerEvents: collected ? 'none' : 'auto',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <span style={{ filter: 'drop-shadow(0 0 2px black)' }}>
        {powerUpData.icon}
      </span>
    </div>
  );
};

export default PowerUp;

// Hook para manejar power-ups activos
export const useActivePowerUps = () => {
  const [activePowerUps, setActivePowerUps] = useState({});

  const activatePowerUp = (type, duration) => {
    if (duration > 0) {
      setActivePowerUps(prev => ({
        ...prev,
        [type]: Date.now() + duration
      }));

      setTimeout(() => {
        setActivePowerUps(prev => {
          const newState = { ...prev };
          delete newState[type];
          return newState;
        });
      }, duration);
    }
  };

  const isPowerUpActive = (type) => {
    return activePowerUps[type] && activePowerUps[type] > Date.now();
  };

  return { activePowerUps, activatePowerUp, isPowerUpActive };
};