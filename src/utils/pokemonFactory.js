import { calcStats, getStageMultiplier, evaluateModifiers, trueDmgCalculator, } from './stats.js';

export function createPokemon({ id, level, data }) {
    const stats = calcStats(data.stats, level);
    return {
        id,
        level,
        data,
        maxHp: stats.hp,
        currentHp: stats.hp,
        status: null,
        volatileStatus: [],
        exp: 0,
        expToNextLevel: level ** 3,
        statModifiers: {
            attack: 0,
            defense: 0,
            speed: 0,
            spAttack: 0,
            spDefense: 0,
            accuracy: 0,
            evasion: 0
        }
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
    const newCurrentHp = Math.min(newMaxHp, oldCurrentHp + (newMaxHp - oldMaxHp));

    const newPlayer = createPokemon({ id: pokeData.id, level: newLevel, data: pokeData });

    // Mantieni Hp, exp, moveset e inventario
    newPlayer.currentHp = newCurrentHp;
    newPlayer.exp = bonusExp;
    newPlayer.moveset = playerInstance.moveset;
    newPlayer.items = playerInstance.items;
    newPlayer.volatileStatus = playerInstance.volatileStatus;

    setPlayer(newPlayer);
    setPlayerStats(newStats);
}