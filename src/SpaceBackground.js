// SpaceBackground.js
import { useEffect, useState } from 'react';
import './App.css';

const STAR_COUNT = 100;
const ASTEROID_COUNT = 15;

export default function SpaceBackground() {
  const [stars, setStars] = useState([]);
  const [asteroids, setAsteroids] = useState([]);

  useEffect(() => {
    const initStars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 1.5 + 0.5
    }));
    const initAsteroids = Array.from({ length: ASTEROID_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 40 + 20,
      speed: Math.random() * 2 + 1
    }));
    setStars(initStars);
    setAsteroids(initAsteroids);

    let animationFrameId;

    const animate = () => {
      setStars(prev => prev.map(s => ({
        ...s,
        y: s.y + s.speed > window.innerHeight ? 0 : s.y + s.speed
      })));
      setAsteroids(prev => prev.map(a => ({
        ...a,
        y: a.y + a.speed > window.innerHeight ? -a.size : a.y + a.speed
      })));
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="space-background">
      {stars.map((s, i) => (
        <div key={i} className="star" style={{
          left: s.x,
          top: s.y,
          width: s.size,
          height: s.size
        }}/>
      ))}
      {asteroids.map((a, i) => (
        <div key={i} className="asteroid" style={{
          left: a.x,
          top: a.y,
          width: a.size,
          height: a.size,
          backgroundImage: `url(./assets/asteroid1.png)`,
          backgroundSize: 'cover'
        }}/>
      ))}
    </div>
  );
}
