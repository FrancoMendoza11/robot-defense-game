import { useState, useEffect, useRef } from 'react';
import TargetCursor from './TargetCursor';
import Robot from './Robot';
import './App.css';

function App() {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [robots, setRobots] = useState([]);
  const [gameActive, setGameActive] = useState(true);
  const gameAreaRef = useRef(null);
  const nextRobotId = useRef(0);

  // Carriles visibles con puntos de inicio claros
  const lanes = [
    { id: 1, start: { x: '50%', y: '0%' }, end: { x: '50%', y: '50%' }, color: 'red' },
    { id: 2, start: { x: '50%', y: '100%' }, end: { x: '50%', y: '50%' }, color: 'blue' },
    { id: 3, start: { x: '0%', y: '50%' }, end: { x: '50%', y: '50%' }, color: 'green' },
    { id: 4, start: { x: '100%', y: '50%' }, end: { x: '50%', y: '50%' }, color: 'yellow' },
    { id: 5, start: { x: '0%', y: '0%' }, end: { x: '50%', y: '50%' }, color: 'purple' },
    { id: 6, start: { x: '100%', y: '100%' }, end: { x: '50%', y: '50%' }, color: 'orange' },
    { id: 7, start: { x: '100%', y: '0%' }, end: { x: '50%', y: '50%' }, color: 'pink' },
    { id: 8, start: { x: '0%', y: '100%' }, end: { x: '50%', y: '50%' }, color: 'cyan' }
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
      
      {/* Base visible */}
      <div className="base">
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

      {/* Carriles visibles */}
      {lanes.map(lane => (
        <div 
          key={`lane-${lane.id}`}
          className="lane-marker"
          style={{
            position: 'absolute',
            left: lane.start.x,
            top: lane.start.y,
            width: '20px',
            height: '20px',
            backgroundColor: lane.color,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            opacity: 0.7
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