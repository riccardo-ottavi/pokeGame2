import { calcStats, getStageMultiplier, evaluateModifiers, trueDmgCalculator, } from './stats.js';

export function createPokemon({ id, level, data, exp = 0 }) {
  const stats = extractStats(data, level);

  return {
    id,
    level,
    data,
    stats,
    maxHp: stats.hp,
    currentHp: stats.hp,
    statModifiers: { attack:0, defense:0, spAttack:0, spDefense:0, speed:0 },
    status: null,
    volatileStatus: [],
    moveset: [],
    exp, // EXP corrente
    expToNextLevel: calculateExpToNextLevel(level) // funzione helper
  };
}

export function calculateExpToNextLevel(level) {
  return Math.floor(50 * Math.pow(1.2, level - 1));
}


export function extractStats(pokeData, level) {
    const get = name =>
        pokeData.stats.find(s => s.stat.name === name).base_stat;

    return {
        hp: Math.floor((get("hp") * level) / 50) + level + 10,
        attack: Math.floor((get("attack") * level) / 50) + 5,
        defense: Math.floor((get("defense") * level) / 50) + 5,
        spAttack: Math.floor((get("special-attack") * level) / 50) + 5,
        spDefense: Math.floor((get("special-defense") * level) / 50) + 5,
        speed: Math.floor((get("speed") * level) / 50) + 5
    };
}


export function createItem(data, outcomeText, healing) {
    return {
        data,
        outcomeText,
        healing,
        name: data.name,
        isItem: true
    };
}

export function instanciatePoke(playerInstance, newLevel, bonusExp) {
  const pokeData = playerInstance.data;
  const oldMaxHp = playerInstance.maxHp;
  const oldCurrentHp = playerInstance.currentHp;

  const newStats = calcStats(pokeData.stats, newLevel);
  const newMaxHp = newStats.hp;

  // Mantieni HP correnti proporzionalmente al nuovo max
  const newCurrentHp = Math.min(newMaxHp, oldCurrentHp + (newMaxHp - oldMaxHp));

  const newPlayer = createPokemon({ id: pokeData.id, level: newLevel, data: pokeData, exp: bonusExp });
  newPlayer.expToNextLevel = calculateExpToNextLevel(newLevel);

  // Mantieni moveset, inventario, volatileStatus
  newPlayer.moveset = playerInstance.moveset;
  newPlayer.items = playerInstance.items;
  newPlayer.volatileStatus = playerInstance.volatileStatus;

  // Imposta HP corretti
  newPlayer.maxHp = newMaxHp;
  newPlayer.currentHp = newCurrentHp;

  return { newPlayer, newStats };
}

