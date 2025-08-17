import { useState, useEffect, useRef } from 'react';
import TargetCursor from './TargetCursor';
import Robot from './Robot';
import naveImage from './assets/nave.png';
import baseImage from './assets/base.gif';
import './App.css';

function App() {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [robots, setRobots] = useState([]);
  const [gameActive, setGameActive] = useState(true);
  const gameAreaRef = useRef(null);
  const nextRobotId = useRef(0);

  const lanes = [
    { id: 1, start: { x: '50%', y: '5%' }, end: { x: '50%', y: '50%' }, rotation: 180 },
    { id: 2, start: { x: '50%', y: '95%' }, end: { x: '50%', y: '50%' }, rotation: 0 },
    { id: 3, start: { x: '5%', y: '50%' }, end: { x: '50%', y: '50%' }, rotation: 90 },
    { id: 4, start: { x: '95%', y: '50%' }, end: { x: '50%', y: '50%' }, rotation: -90 },
    { id: 5, start: { x: '8%', y: '8%' }, end: { x: '50%', y: '50%' }, rotation: 135 },
    { id: 6, start: { x: '92%', y: '92%' }, end: { x: '50%', y: '50%' }, rotation: -45 },
    { id: 7, start: { x: '92%', y: '8%' }, end: { x: '50%', y: '50%' }, rotation: -135 },
    { id: 8, start: { x: '8%', y: '92%' }, end: { x: '50%', y: '50%' }, rotation: 45 }
  ];

  const spawnRobot = () => {
    if (!gameActive || !gameAreaRef.current) return;

    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const newRobot = {
      id: nextRobotId.current++,
      lane,
      health: 100,
      speed: 1 + Math.random()
    };

    setRobots(prev => [...prev, newRobot]);
  };

  const handleDamage = (id, damage) => {
    setRobots(prev => prev.map(robot => {
      if (robot.id === id) {
        const newHealth = robot.health - damage;
        if (newHealth <= 0) {
          setTimeout(() => setRobots(prev => prev.filter(r => r.id !== id)), 100);
          setScore(prev => prev + 10);
        }
        return { ...robot, health: newHealth };
      }
      return robot;
    }));
  };

  const handleReachBase = (id) => {
    setRobots(prev => prev.filter(robot => robot.id !== id));
    setHealth(prev => Math.max(0, prev - 10));
    if (health <= 10) setGameActive(false);
  };

  useEffect(() => {
    if (!gameActive) return;
    const spawnInterval = setInterval(spawnRobot, 2000);
    return () => clearInterval(spawnInterval);
  }, [gameActive]);

  return (
    <div className="game-container" ref={gameAreaRef}>
      <TargetCursor spinDuration={1.5} hideDefaultCursor={true} targetSelector=".robot" />

      {/* Base con imagen */}
      <div className="base">
        <img src={baseImage} alt="Base" className="base-image" />
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${health}%` }} />
        </div>
      </div>

      <div className="score-display">Puntuación: {score}</div>

      {!gameActive && (
        <div className="game-over">
          <h2>¡Juego Terminado!</h2>
          <button onClick={() => {
            setHealth(100);
            setScore(0);
            setRobots([]);
            setGameActive(true);
          }}>Reiniciar</button>
        </div>
      )}

      {/* Carriles como naves */}
      {lanes.map(lane => (
        <img
          key={`lane-${lane.id}`}
          src={naveImage}
          alt="Nave"
          className="lane-marker"
          style={{
            left: lane.start.x,
            top: lane.start.y,
            width: '120px',
            height: '120px',
            transform: `translate(-50%, -50%) rotate(${lane.rotation}deg)`,
            "--rotation": `${lane.rotation}deg`
          }}
        />
      ))}

      {/* Robots */}
      {robots.map(robot => (
        <Robot
          key={robot.id}
          {...robot}
          onDamage={handleDamage}
          onReachBase={handleReachBase}
          gameAreaRef={gameAreaRef}
        />
      ))}
    </div>
  );
}

export default App;
