import { useState, useEffect, useRef } from 'react';
import TargetCursor from './TargetCursor';
import Robot from './Robot';

import baseImage from './assets/base.gif';
import menuGif from './assets/menu.gif';
import defenderGif from './assets/robotdefender.gif';
import SpaceBackground from './SpaceBackground';
import BackgroundMusic from "./BackgroundMusic";
import './App.css';
import shootSoundFile from "./assets/sounds/shoot.mp3";
import { Howl } from "howler";

// Creamos la instancia del sonido
const shootSound = new Howl({
  src: [shootSoundFile],
  volume: 0.6, // podés ajustar el volumen
});

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

  // 🚀 Defender
  const [defenderUnlocked, setDefenderUnlocked] = useState(false);
  const [defenderDamage, setDefenderDamage] = useState(10);
  const [defenderPosition, setDefenderPosition] = useState({ x: 300, y: 300 });

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

  // Historia
  useEffect(() => {
    if (showStory) {
      const timer = setTimeout(() => {
        setShowStory(false);
        setGameStarted(true);
      }, 25000);
      return () => clearTimeout(timer);
    }
  }, [showStory]);

  // Pausa con ESC
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
    const newRobot = {
      id: nextRobotId.current++,
      lane,
      health: round >= 10 ? 200 : 100,
      speed: (round >= 10 ? 0.9 : 0.5) + Math.random() * 0.4,
      x: lane.start.x.includes('%') ? (parseFloat(lane.start.x) / 100) * window.innerWidth : parseFloat(lane.start.x),
      y: lane.start.y.includes('%') ? (parseFloat(lane.start.y) / 100) * window.innerHeight : parseFloat(lane.start.y)
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

  // Comprar
  const buyItem = (cost, effect) => {
    if (score >= cost) {
      setScore(prev => prev - cost);
      effect();
    }
  };

  // Rondas y tienda
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

  
  useEffect(() => {
  if (!defenderUnlocked || !gameActive || paused || inShop) return;

  const interval = setInterval(() => {
    setDefenderPosition(prevPos => {
      if (robots.length === 0) return prevPos;

      // Elegir el robot más cercano
      const target = robots.reduce((closest, r) => {
        const dist = Math.hypot(r.x - prevPos.x, r.y - prevPos.y);
        return (!closest || dist < closest.dist) ? { robot: r, dist } : closest;
      }, null)?.robot;

      if (!target) return prevPos;

      // Calcular movimiento
      let dx = target.x - prevPos.x;
      let dy = target.y - prevPos.y;
      const dist = Math.hypot(dx, dy);
      const speed = 8; // velocidad más rápida
      if (dist > speed) {
        dx = (dx / dist) * speed;
        dy = (dy / dist) * speed;
      } else {
        dx = dx;
        dy = dy;
      }

      const newX = prevPos.x + dx;
      const newY = prevPos.y + dy;

      // Colisión exacta: daño al contacto
      setRobots(prevRobots => prevRobots.map(r => {
        if (Math.abs(newX - r.x) < 30 && Math.abs(newY - r.y) < 30) { 
          const newHealth = r.health - defenderDamage;
          if (newHealth <= 0) {
            setScore(prev => prev + 5);
            return null;
          }
          return { ...r, health: newHealth };
        }
        return r;
      }).filter(r => r !== null));

      return { x: newX, y: newY };
    });
  }, 50); // intervalo más rápido para suavidad


  return () => clearInterval(interval);
}, [defenderUnlocked, robots, defenderDamage, inShop, paused, gameActive]);

useEffect(() => {
  const gameArea = gameAreaRef.current;
  if (!gameArea) return;

  const handleClick = () => {
    shootSound.play();
  };

  gameArea.addEventListener("click", handleClick);

  return () => {
    gameArea.removeEventListener("click", handleClick);
  };
}, []);


return (
  <div className="game-container" ref={gameAreaRef}>
    {/* Fondo animado */}
    <SpaceBackground />
    <BackgroundMusic play={gameStarted || showStory} />


    <TargetCursor spinDuration={1.5} hideDefaultCursor={true} targetSelector=".robot" />

    {/* Base */}
    <div className="base">
      <img src={baseImage} alt="Base" className="base-image" draggable="false" />
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

    {/* Defender */}
    {defenderUnlocked && (
      <img
        src={defenderGif}
        alt="Defender"
        className="defender"
        style={{ left: defenderPosition.x, top: defenderPosition.y }}
        draggable="false"
      />
    )}

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
          setDefenderUnlocked(false);
          setDefenderDamage(10);
        }}>Reiniciar</button>
      </div>
    )}

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
      <div className="story-screen" onClick={() => { setShowStory(false); setGameStarted(true); }}>
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
	  <div
	    className="menu-screen"
	    onClick={() => {
	      setShowStory(true);
	    }}
	  >
	    <img src={menuGif} alt="Menu Fondo" className="menu-bg" draggable="false" />
	    <div className="menu-title">The Defenders</div>
	    <div className="menu-instruction">START</div>
	  </div>
	)}

     {/* Tienda */}
      {inShop && (
        <div className="shop-overlay">
          <div className="shop-box">
            <h2 className="shop-title">TIENDA DE PUNTOS</h2>
            <div className="shop-grid">
              <div className="shop-item" onClick={() => buyItem(5, () => setHealth(prev => Math.min(prev + 20, 100)))}>
                <p className="item-name">+VIDA</p>
                <p className="item-cost">5 pts</p>
              </div>
              <div className="shop-item" onClick={() => buyItem(7, () => setDamageMultiplier(prev => prev + 0.2))}>
                <p className="item-name">+DAÑO</p>
                <p className="item-cost">7 pts</p>
              </div>
              {!defenderUnlocked ? (
                <div className="shop-item" onClick={() => buyItem(100, () => setDefenderUnlocked(true))}>
                  <p className="item-name">ROBOT DEFENDER</p>
                  <p className="item-cost">100 pts</p>
                </div>
              ) : (
                <div className="shop-item" onClick={() => buyItem(50, () => setDefenderDamage(prev => prev + 10))}>
                  <p className="item-name">Mejorar DEFENDER</p>
                  <p className="item-cost">50 pts</p>
                </div>
              )}
            </div>
            <p className="shop-score">Puntos: {score}</p>
            <button
              className="shop-continue"
              onClick={() => {
                setInShop(false);
                setRound(prev => prev + 1);
                setTimeLeft(45);
              }}
            >
              CONTINUAR
            </button>
          </div>
        </div>
      )}

      {/* Menú de pausa */}
      {paused && (
        <div className="menu-screen">
          <div className="menu-title">PAUSA</div>
          <div className="shop-container">
            <div className="shop-item" onClick={() => setPaused(false)}>REANUDAR</div>
            <div className="shop-item" onClick={() => { setPaused(false); setGameStarted(false); setGameActive(false); }}>SALIR</div>
          </div>
        </div>
      )}
    </div>
  );


}

export default App;
