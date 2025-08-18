import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import robotImage from './assets/robot.gif';
import shootSoundFile from "./assets/sounds/shoot.mp3";
import { Howl } from "howler";

// Creamos la instancia del sonido
const shootSound = new Howl({
  src: [shootSoundFile],
  volume: 0.6, // podés ajustar el volumen
});

const Robot = ({ id, lane, health, onDamage, onReachBase, gameAreaRef, paused }) => {
  const robotRef = useRef(null);
  const movementRef = useRef(null);
  const [stuck, setStuck] = useState(false);
  const damageAmount = 20;

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

    movementRef.current = gsap.to(robotRef.current, {
      x: finalX,
      y: finalY,
      duration: 10,
      ease: "none",
      paused: paused,
      onComplete: () => setStuck(true)
    });

    return () => movementRef.current.kill();
  }, [id, lane, gameAreaRef]);

  // Pausa o reproduce animación
  useEffect(() => {
    if (movementRef.current) {
      paused ? movementRef.current.pause() : movementRef.current.play();
    }
  }, [paused]);

  // Llega a la base
  useEffect(() => {
    if (stuck) {
      onReachBase(id);
    }
  }, [stuck, id, onReachBase]);

  // Daño al click
  const handleClick = (e) => {
    e.stopPropagation();
    shootSound.play();
    onDamage(id, damageAmount);
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
      className="robot"
      style={{
        position: 'absolute',
        width: '145px',
        height: '145px',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        pointerEvents: 'auto',
        cursor: 'pointer'
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
    draggable="false"

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
