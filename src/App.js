import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TargetCursor from './TargetCursor';
import Robot from './Robot';
import PowerUp, { POWERUP_TYPES } from './PowerUp';

import baseImage from './assets/base.gif';
import menuGif from './assets/menu.gif';
import defenderGif from './assets/robotdefender.gif';
import SpaceBackground from './SpaceBackground';
import BackgroundMusic from "./BackgroundMusic";
import './App.css';
import shootSoundFile from "./assets/sounds/shoot.mp3";
import { Howl } from "howler";

// Precargar sonidos
const shootSound = new Howl({
  src: [shootSoundFile],
  volume: 0.6,
  html5: true,
});

const explosionSound = new Howl({
  src: [shootSoundFile], // Usar tu archivo de explosión
  volume: 0.8,
  html5: true,
});

// Tipos de enemigos mejorados
const ENEMY_TYPES = {
  scout: { health: 80, speed: 0.7, points: 1, size: 120, color: '#00FF00' },
  tank: { health: 250, speed: 0.25, points: 5, size: 180, color: '#FF0000' },
  runner: { health: 60, speed: 1.2, points: 3, size: 100, color: '#FFFF00' },
  boss: { health: 500, speed: 0.4, points: 20, size: 250, color: '#FF00FF' },
  shielded: { health: 150, speed: 0.5, points: 8, size: 150, color: '#00FFFF', shield: 100 }
};

// Efecto visual de disparo
function ClickEffect({ x, y, isCritical, onComplete }) {
  return (
    <div
      className={`click-effect ${isCritical ? 'critical' : ''}`}
      style={{
        left: x - 16,
        top: y - 16,
        pointerEvents: "none",
      }}
      onAnimationEnd={onComplete}
    />
  );
}

// Lanes
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

function App() {
  // Estados del juego
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [robots, setRobots] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [gameActive, setGameActive] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(45);
  const [inShop, setInShop] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showStory, setShowStory] = useState(false);

  // Upgrades
  const [damageMultiplier, setDamageMultiplier] = useState(1);
  const [criticalChance, setCriticalChance] = useState(0);
  const [defenderUnlocked, setDefenderUnlocked] = useState(false);
  const [defenderDamage, setDefenderDamage] = useState(10);
  const [defenderPosition, setDefenderPosition] = useState({ x: 300, y: 300 });

  // Power-ups activos
  const [activePowerUps, setActivePowerUps] = useState({});

  const [clickEffects, setClickEffects] = useState([]);
  const gameAreaRef = useRef(null);
  const nextRobotId = useRef(0);
  const nextPowerUpId = useRef(0);
  const firstClickRef = useRef(false);
  const comboRef = useRef(0);
  const comboTimerRef = useRef(null);

  // Selección inteligente de enemigo según ronda
  const getEnemyForRound = useCallback((currentRound) => {
    // Boss cada 10 rondas
    if (currentRound % 10 === 0) return 'boss';
    
    const roll = Math.random();
    
    if (currentRound >= 7 && roll < 0.15) return 'shielded';
    if (currentRound >= 5 && roll < 0.3) return 'runner';
    if (currentRound >= 3 && roll < 0.5) return 'tank';
    return 'scout';
  }, []);

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

  // Spawn robots optimizado
  const spawnRobot = useCallback(() => {
    if (!gameActive || !gameStarted || inShop || paused || !gameAreaRef.current) return;
    
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const type = getEnemyForRound(round);
    const enemyData = ENEMY_TYPES[type];

    const newRobot = {
      id: nextRobotId.current++,
      lane,
      type,
      health: enemyData.health,
      maxHealth: enemyData.health,
      shield: enemyData.shield || 0,
      speed: enemyData.speed,
      points: enemyData.points,
      size: enemyData.size,
      x: lane.start.x.includes('%') ? (parseFloat(lane.start.x) / 100) * window.innerWidth : parseFloat(lane.start.x),
      y: lane.start.y.includes('%') ? (parseFloat(lane.start.y) / 100) * window.innerHeight : parseFloat(lane.start.y)
    };
    
    setRobots(prev => [...prev, newRobot]);
  }, [gameActive, gameStarted, inShop, paused, round, getEnemyForRound]);

  // Spawn power-ups aleatorios
  const spawnPowerUp = useCallback(() => {
    if (!gameActive || !gameStarted || inShop || paused || Math.random() > 0.3) return;

    const powerUpTypes = ['HEALTH', 'RAPID_FIRE', 'SHIELD', 'NUKE', 'DOUBLE_POINTS'];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

    const newPowerUp = {
      id: nextPowerUpId.current++,
      type: randomType,
      x: Math.random() * (window.innerWidth - 100) + 50,
      y: Math.random() * (window.innerHeight - 100) + 50
    };

    setPowerUps(prev => [...prev, newPowerUp]);
  }, [gameActive, gameStarted, inShop, paused]);

  // Cálculo de daño con críticos
  const calculateDamage = useCallback((baseDamage) => {
    const isCritical = Math.random() < criticalChance;
    const multiplier = activePowerUps.rapidFire ? 1.5 : 1;
    const finalDamage = baseDamage * damageMultiplier * multiplier * (isCritical ? 2 : 1);
    return { damage: finalDamage, isCritical };
  }, [damageMultiplier, criticalChance, activePowerUps.rapidFire]);

  // Daño optimizado con useCallback
  const handleDamage = useCallback((id, baseDamage) => {
    const { damage, isCritical } = calculateDamage(baseDamage);
    
    setRobots(prev => prev.map(robot => {
      if (robot.id === id) {
        const newHealth = robot.health - damage;
        if (newHealth <= 0) {
          setTimeout(() => setRobots(prev => prev.filter(r => r.id !== id)), 100);
          
          // Puntos con multiplicador
          const pointMultiplier = activePowerUps.doublePoints ? 2 : 1;
          const comboBonus = Math.floor(comboRef.current / 5);
          setScore(prev => prev + (robot.points * pointMultiplier) + comboBonus);
          
          // Incrementar combo
          comboRef.current++;
          clearTimeout(comboTimerRef.current);
          comboTimerRef.current = setTimeout(() => {
            comboRef.current = 0;
          }, 2000);

          // Chance de dropear power-up al matar
          if (Math.random() < 0.15) {
            spawnPowerUp();
          }
        }
        return { ...robot, health: newHealth };
      }
      return robot;
    }));
  }, [calculateDamage, activePowerUps.doublePoints, spawnPowerUp]);

  // Base alcanzada
  const handleReachBase = useCallback((id) => {
    setRobots(prev => {
      const robot = prev.find(r => r.id === id);
      if (robot) {
        const damage = robot.type === 'boss' ? 25 : robot.type === 'tank' ? 15 : 10;
        setHealth(prevHealth => {
          const newHealth = Math.max(0, prevHealth - damage);
          if (newHealth <= 0) setGameActive(false);
          return newHealth;
        });
      }
      return prev.filter(r => r.id !== id);
    });
  }, []);

  // Recolectar power-up
  const handleCollectPowerUp = useCallback((id, type) => {
    setPowerUps(prev => prev.filter(p => p.id !== id));
    
    if (!type) return; // Power-up expiró

    switch(type) {
      case 'HEALTH':
        setHealth(prev => Math.min(prev + 30, maxHealth));
        break;
      case 'NUKE':
        // Eliminar todos los enemigos
        robots.forEach(robot => {
          setScore(prev => prev + robot.points);
        });
        setRobots([]);
        explosionSound.play();
        break;
      case 'RAPID_FIRE':
      case 'SHIELD':
      case 'DOUBLE_POINTS':
        setActivePowerUps(prev => ({
          ...prev,
          [type.toLowerCase()]: true
        }));
        setTimeout(() => {
          setActivePowerUps(prev => {
            const newState = { ...prev };
            delete newState[type.toLowerCase()];
            return newState;
          });
        }, type === 'SHIELD' ? 15000 : type === 'DOUBLE_POINTS' ? 20000 : 10000);
        break;
    }
  }, [maxHealth, robots]);

  // Comprar
  const buyItem = useCallback((cost, effect) => {
    if (score >= cost) {
      setScore(prev => prev - cost);
      effect();
    }
  }, [score]);

  // Rondas y tienda
  useEffect(() => {
    if (!gameStarted || paused || !gameActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!inShop) {
            setInShop(true);
            setRobots([]);
            setPowerUps([]);
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

  // Intervalo de spawn - velocidad aumenta con rondas
  useEffect(() => {
    if (!gameStarted || paused || !gameActive || inShop) return;
    
    const spawnRate = Math.max(1000, 2500 - round * 150);
    const spawnInterval = setInterval(spawnRobot, spawnRate);
    
    return () => clearInterval(spawnInterval);
  }, [gameStarted, paused, inShop, gameActive, round, spawnRobot]);

  // Defender AI optimizado
  useEffect(() => {
    if (!defenderUnlocked || !gameActive || paused || inShop) return;

    const interval = setInterval(() => {
      setDefenderPosition(prevPos => {
        if (robots.length === 0) return prevPos;

        const target = robots.reduce((closest, r) => {
          const dist = Math.hypot(r.x - prevPos.x, r.y - prevPos.y);
          return (!closest || dist < closest.dist) ? { robot: r, dist } : closest;
        }, null)?.robot;

        if (!target) return prevPos;

        let dx = target.x - prevPos.x;
        let dy = target.y - prevPos.y;
        const dist = Math.hypot(dx, dy);
        const speed = 8;
        
        if (dist > speed) {
          dx = (dx / dist) * speed;
          dy = (dy / dist) * speed;
        }

        const newX = prevPos.x + dx;
        const newY = prevPos.y + dy;

        setRobots(prevRobots => prevRobots.map(r => {
          if (Math.abs(newX - r.x) < 30 && Math.abs(newY - r.y) < 30) {
            const newHealth = r.health - defenderDamage;
            if (newHealth <= 0) {
              setScore(prev => prev + r.points);
              return null;
            }
            return { ...r, health: newHealth };
          }
          return r;
        }).filter(r => r !== null));

        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [defenderUnlocked, robots, defenderDamage, inShop, paused, gameActive]);

  // Click handler optimizado
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const handleClick = (e) => {
      const rect = gameArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const isCritical = Math.random() < criticalChance;
      setClickEffects(prev => [...prev, { id: Date.now(), x, y, isCritical }]);

      if (!firstClickRef.current) {
        shootSound.play();
        firstClickRef.current = true;
      } else {
        shootSound.play();
      }
    };

    gameArea.addEventListener("click", handleClick);
    return () => gameArea.removeEventListener("click", handleClick);
  }, [criticalChance]);

  // Indicadores de power-ups activos
  const activePowerUpIndicators = useMemo(() => {
    return Object.keys(activePowerUps).map(key => ({
      name: key.replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
      color: key === 'rapidFire' ? '#FFFF00' : key === 'shield' ? '#00FFFF' : '#FFA500'
    }));
  }, [activePowerUps]);

  return (
    <div className="game-container" ref={gameAreaRef}>
      <SpaceBackground />
      <BackgroundMusic play={gameStarted || showStory} />
      <TargetCursor spinDuration={1.5} hideDefaultCursor={true} targetSelector=".robot" />

      {/* Base */}
      <div className="base">
        <img src={baseImage} alt="Base" className="base-image" draggable="false" />
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${(health/maxHealth)*100}%` }} />
          <span className="health-text">{health}/{maxHealth}</span>
        </div>
      </div>

      {/* HUD */}
      <div className="score-display">Score: {score}</div>
      <div className="round-timer">Round: {round} | Time: {timeLeft}s</div>
      
      {/* Combo counter */}
      {comboRef.current > 0 && (
        <div className="combo-display">
          COMBO x{comboRef.current}
        </div>
      )}

      {/* Power-ups activos */}
      {activePowerUpIndicators.length > 0 && (
        <div className="active-powerups">
          {activePowerUpIndicators.map((powerUp, index) => (
            <div key={index} className="powerup-indicator" style={{ borderColor: powerUp.color, color: powerUp.color }}>
              {powerUp.name}
            </div>
          ))}
        </div>
      )}

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

      {/* Power-ups */}
      {powerUps.map(powerUp => (
        <PowerUp
          key={powerUp.id}
          {...powerUp}
          onCollect={handleCollectPowerUp}
          gameAreaRef={gameAreaRef}
        />
      ))}

      {/* Click effects */}
      {clickEffects.map(ef => (
        <ClickEffect
          key={ef.id}
          x={ef.x}
          y={ef.y}
          isCritical={ef.isCritical}
          onComplete={() => setClickEffects(prev => prev.filter(p => p.id !== ef.id))}
        />
      ))}

      {/* Story screen */}
      {showStory && (
        <div className="story-screen" onClick={() => { setShowStory(false); setGameStarted(true); }}>
          <div className="story-crawl">
            <p>The Defenders were heading on a mission...</p>
            <p>When they were intercepted by intergalactic enemies.</p>
            <p>They are surrounded!</p>
            <p>You can help them.</p>
            <p>How many rounds will they survive?</p>
            <p>That depends on you.</p>
          </div>
        </div>
      )}

      {/* Menu screen */}
      {!gameStarted && !showStory && (
        <div className="menu-screen" onClick={() => setShowStory(true)}>
          <img src={menuGif} alt="Menu Background" className="menu-bg" draggable="false" />
          <div className="menu-title">Defend the Rogueship</div>
          <div className="menu-instruction">START</div>
        </div>
      )}

      {/* Shop mejorado */}
      {inShop && (
        <div className="shop-overlay">
          <div className="shop-box">
            <h2 className="shop-title">⚡ UPGRADE STATION ⚡</h2>
            <div className="shop-grid">
              <div className="shop-item" onClick={() => buyItem(15, () => setHealth(prev => Math.min(prev + 20, maxHealth)))}>
                <p className="item-name">❤️ REPAIR</p>
                <p className="item-cost">15 pts</p>
                <p className="item-desc">+20 HP</p>
              </div>
              <div className="shop-item" onClick={() => buyItem(20, () => setMaxHealth(prev => prev + 20))}>
                <p className="item-name">🛡️ MAX HP</p>
                <p className="item-cost">20 pts</p>
                <p className="item-desc">+20 Max Health</p>
              </div>
              <div className="shop-item" onClick={() => buyItem(15, () => setDamageMultiplier(prev => prev + 0.3))}>
                <p className="item-name">⚔️ DAMAGE</p>
                <p className="item-cost">15 pts</p>
                <p className="item-desc">+30% DMG</p>
              </div>
              <div className="shop-item" onClick={() => buyItem(25, () => setCriticalChance(prev => Math.min(prev + 0.15, 0.75)))}>
                <p className="item-name">💥 CRITICAL</p>
                <p className="item-cost">25 pts</p>
                <p className="item-desc">+15% Crit</p>
              </div>
              {!defenderUnlocked ? (
                <div className="shop-item shop-item-special" onClick={() => buyItem(100, () => setDefenderUnlocked(true))}>
                  <p className="item-name">🤖 DEFENDER</p>
                  <p className="item-cost">100 pts</p>
                  <p className="item-desc">Ally Robot</p>
                </div>
              ) : (
                <div className="shop-item" onClick={() => buyItem(50, () => setDefenderDamage(prev => prev + 15))}>
                  <p className="item-name">⬆️ DEFENDER+</p>
                  <p className="item-cost">50 pts</p>
                  <p className="item-desc">+15 DMG</p>
                </div>
              )}
            </div>
            <p className="shop-score">💰 Points: {score}</p>
            <p className="shop-round">Round {round} Complete!</p>
            <button
              className="shop-continue"
              onClick={() => {
                setInShop(false);
                setRound(prev => prev + 1);
                setTimeLeft(45);
              }}
            >
              ▶ CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* Pause screen */}
      {paused && (
        <div className="menu-screen">
          <div className="menu-title">⏸ PAUSED</div>
          <div className="shop-container">
            <div className="shop-item" onClick={() => setPaused(false)}>▶ RESUME</div>
            <div className="shop-item" onClick={() => { 
              setPaused(false); 
              setGameStarted(false); 
              setGameActive(false); 
              setRobots([]);
              setPowerUps([]);
            }}>🚪 EXIT</div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {!gameActive && gameStarted && (
        <div className="game-over-screen">
          <div className="game-over-box">
            <h1 className="game-over-title">💀 GAME OVER 💀</h1>
            <p className="game-over-stats">Final Score: {score}</p>
            <p className="game-over-stats">Rounds Survived: {round}</p>
            <button className="game-over-button" onClick={() => window.location.reload()}>
              🔄 RETRY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;