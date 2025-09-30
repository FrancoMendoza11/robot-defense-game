// hooks/useGameState.js
import { useState, useCallback } from 'react';

export const useGameState = () => {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameActive, setGameActive] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [inShop, setInShop] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showStory, setShowStory] = useState(false);

  const takeDamage = useCallback((amount) => {
    setHealth(prev => {
      const newHealth = Math.max(0, prev - amount);
      if (newHealth <= 0) setGameActive(false);
      return newHealth;
    });
  }, []);

  const addScore = useCallback((points) => {
    setScore(prev => prev + points);
  }, []);

  const resetGame = useCallback(() => {
    setHealth(100);
    setScore(0);
    setRound(1);
    setGameActive(true);
    setGameStarted(false);
    setTimeLeft(45);
    setInShop(false);
    setPaused(false);
  }, []);

  return {
    health, setHealth,
    score, addScore,
    round, setRound,
    gameActive, setGameActive,
    gameStarted, setGameStarted,
    timeLeft, setTimeLeft,
    inShop, setInShop,
    paused, setPaused,
    showStory, setShowStory,
    takeDamage,
    resetGame
  };
};