import { useState, useEffect, useRef } from 'react';
import TargetCursor from './TargetCursor';
import Robot from './Robot';
import naveImage from './assets/nave.png';
import baseImage from './assets/base.gif';
import menuGif from './assets/menu.gif';
import './App.css';

function App() {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [robots, setRobots] = useState([]);
  const [gameActive, setGameActive] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(45);
  const [inShop, setInShop] = useState(false);
  const [paused, setPaused] = useState(false);
  const [damageMultiplier, setDamageMultiplier] = useState(1);

  const [showStory, setShowStory] = useState(false);

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

  // Historia: se esconde sola después de 25s si no hacen click
  useEffect(() => {
    if (showStory) {
      const timer = setTimeout(() => {
        setShowStory(false);
        setGameStarted(true); // arranca el juego al terminar historia
      }, 25000);
      return () => clearTimeout(timer);
    }
  }, [showStory]);

  // Detectar ESCAPE para pausar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && gameStarted && !inShop) {
        setPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, inShop]);

  // Spawn robots
  const spawnRobot = () => {
    if (!gameActive || !gameStarted || inShop || paused || !gameAreaRef.current) return;
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const difficultyFactor = Math.min(round, 10);
    const newRobot = {
      id: nextRobotId.current++,
      lane,
      health: 100,
      speed: 0.4 + 0.08 * difficultyFactor + Math.random() * 0.4
    };
    setRobots(prev => [...prev, newRobot]);
  };

  // Daño
  const handleDamage = (id, damage) => {
    const totalDamage = damage * damageMultiplier;
    setRobots(prev => prev.map(robot => {
      if (robot.id === id) {
        const newHealth = robot.health - totalDamage;
        if (newHealth <= 0) {
          setTimeout(() => setRobots(prev => prev.filter(r => r.id !== id)), 100);
          setScore(prev => prev + 1);
        }
        return { ...robot, health: newHealth };
      }
      return robot;
    }));
  };

  // Base alcanzada
  const handleReachBase = (id) => {
    setRobots(prev => prev.filter(robot => robot.id !== id));
    setHealth(prev => Math.max(0, prev - 10));
    if (health <= 10) setGameActive(false);
  };

  // Comprar en tienda
  const buyItem = (cost, effect) => {
    if (score >= cost) {
      setScore(prev => prev - cost);
      effect();
    }
  };

  // Temporizador rondas + shop
  useEffect(() => {
    if (!gameStarted || paused || !gameActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!inShop) {
            setInShop(true);
            setRobots([]);
            return 30;
          } else {
            setInShop(false);
            setRound(prevRound => prevRound + 1);
            return 45;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, paused, inShop, gameActive]);

  // Intervalo de spawn
  useEffect(() => {
    if (!gameStarted || paused || !gameActive) return;
    if (inShop) return;
    const spawnInterval = setInterval(spawnRobot, 2000);
    return () => clearInterval(spawnInterval);
  }, [gameStarted, paused, inShop, gameActive, round]);

  return (
    <div className="game-container" ref={gameAreaRef}>
      <TargetCursor spinDuration={1.5} hideDefaultCursor={true} targetSelector=".robot" />

      {/* Base */}
      <div className="base">
        <img src={baseImage} alt="Base" className="base-image" />
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${health}%` }} />
          <span className="health-text">{health}%</span>
        </div>
      </div>

      {/* Score */}
      <div className="score-display">{score}</div>

      {/* Ronda y Timer */}
      <div className="round-timer">
        Ronda: {round} | Tiempo: {timeLeft}s
      </div>

      {/* Game Over */}
      {!gameActive && (
        <div className="game-over">
          <h2>¡Juego Terminado!</h2>
          <button onClick={() => {
            setHealth(100);
            setScore(0);
            setRobots([]);
            setGameActive(true);
            setGameStarted(false);
            setRound(1);
            setTimeLeft(45);
            setDamageMultiplier(1);
          }}>Reiniciar</button>
        </div>
      )}

      {/* Carriles */}
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
          paused={paused || inShop}
        />
      ))}

      {/* Historia */}
      {showStory && (
        <div className="story-screen" onClick={() => {
          setShowStory(false);
          setGameStarted(true);
        }}>
          <div className="story-crawl">
            <p>Los Defenders iban rumbo a una misión...</p>
            <p>Cuando fueron interceptados por los Lombricons.</p>
            <p>¡Están rodeados!</p>
            <p>Vos podés ayudarlos.</p>
            <p>¿Cuántas rondas sobrevivirán?</p>
            <p>Depende de vos.</p>
          </div>
        </div>
      )}

      {/* Menú principal */}
      {!gameStarted && !showStory && (
        <div className="menu-screen" onClick={() => setShowStory(true)}>
          <img src={menuGif} alt="Menu Fondo" className="menu-bg" />
          <div className="menu-title">The Defenders</div>
          <div className="menu-instruction">START</div>
        </div>
      )}

      {/* Tienda */}
      {inShop && (
        <div className="menu-screen">
          <div className="menu-title">TIENDA DE PUNTOS</div>
          <div className="shop-container">
            <div className="shop-item" onClick={() => buyItem(5, () => setHealth(prev => Math.min(prev + 20, 100)))}>
              +VIDA <br/> <small>5 pts</small>
            </div>
            <div className="shop-item" onClick={() => buyItem(7, () => setDamageMultiplier(prev => prev + 0.2))}>
              +DAÑO <br/> <small>7 pts</small>
            </div>
          </div>
        </div>
      )}

      {/* Menú de pausa */}
      {paused && (
        <div className="menu-screen">
          <div className="menu-title">PAUSA</div>
          <div className="shop-container">
            <div className="shop-item" onClick={() => setPaused(false)}>REANUDAR</div>
            <div className="shop-item" onClick={() => {
              setPaused(false);
              setGameStarted(false);
              setGameActive(false);
            }}>SALIR</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
