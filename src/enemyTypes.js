// constants/enemyTypes.js

export const ENEMY_TYPES = {
  SCOUT: {
    id: 'scout',
    health: 80,
    speed: 0.7,
    damage: 5,
    points: 1,
    color: '#00FF00',
    size: 120,
    spawnChance: 0.5,
    minRound: 1,
    description: 'Fast and weak'
  },
  TANK: {
    id: 'tank',
    health: 250,
    speed: 0.25,
    damage: 15,
    points: 5,
    color: '#FF0000',
    size: 180,
    spawnChance: 0.25,
    minRound: 3,
    description: 'Slow but tough'
  },
  RUNNER: {
    id: 'runner',
    health: 60,
    speed: 1.2,
    damage: 8,
    points: 3,
    color: '#FFFF00',
    size: 100,
    spawnChance: 0.15,
    minRound: 5,
    description: 'Extremely fast'
  },
  BOSS: {
    id: 'boss',
    health: 500,
    speed: 0.4,
    damage: 25,
    points: 20,
    color: '#FF00FF',
    size: 250,
    spawnChance: 0,
    minRound: 10,
    description: 'Mini boss'
  },
  SHIELDED: {
    id: 'shielded',
    health: 150,
    speed: 0.5,
    damage: 10,
    points: 8,
    color: '#00FFFF',
    size: 150,
    spawnChance: 0.1,
    minRound: 7,
    shield: 100,
    description: 'Has shield protection'
  }
};

export const getEnemyForRound = (round) => {
  const availableEnemies = Object.values(ENEMY_TYPES).filter(
    enemy => enemy.minRound <= round && enemy.spawnChance > 0
  );

  // Boss cada 10 rondas
  if (round % 10 === 0) {
    return ENEMY_TYPES.BOSS;
  }

  const roll = Math.random();
  let cumulative = 0;

  for (const enemy of availableEnemies) {
    cumulative += enemy.spawnChance;
    if (roll <= cumulative) return enemy;
  }

  return ENEMY_TYPES.SCOUT;
};

export const getSpawnRate = (round) => {
  // Más enemigos por ronda
  return Math.max(1000, 2500 - round * 150);
};