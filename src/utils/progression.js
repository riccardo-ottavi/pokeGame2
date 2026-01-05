import { generateRandomId, fetchFromApi } from "./api";
import { idLimit } from "../constants";
import { createPokemon } from "./pokemonFactory";
import { calcStats } from "./stats";
import { initializeMoveset } from "./moves";


//inizializza player e nemico con this. e gli aggiunge proprietà items e moveset
export async function firstInstancePokemon(target, setters, stage) {
    const { setPlayer, setPlayerStats, setEnemy, setEnemyStats, initializeItems } = setters;

    if (target === "player") {
        const pokeId = generateRandomId(idLimit);
        const poke = await fetchFromApi("pokemon", pokeId);

        const instanciatedPlayer = createPokemon({ id: pokeId, level: 5, data: poke });
        setPlayer(instanciatedPlayer);

        const playerStatsObj = calcStats(poke.stats, 5);
        setPlayerStats(playerStatsObj);

        const moveNames = await initializeMoveset(instanciatedPlayer, 2);
        setPlayer(prev => ({ ...prev, moveset: moveNames }));

        initializeItems("player", instanciatedPlayer);
    } else {
        const pokeId = generateRandomId(idLimit);
        const poke = await fetchFromApi("pokemon", pokeId);

        const enemyLevel = getEnemyLevel(stage);

        const enemyStatsObj = calcStats(poke.stats, enemyLevel);
        const instanciatedEnemy = createPokemon({ id: pokeId, level: enemyLevel, data: poke });
        instanciatedEnemy.currentHp = enemyStatsObj.hp;
        instanciatedEnemy.maxHp = enemyStatsObj.hp;

        setEnemy(instanciatedEnemy);
        setEnemyStats(enemyStatsObj);

        const moveNames = await initializeMoveset(instanciatedEnemy, 2);
        setEnemy(prev => ({ ...prev, moveset: moveNames }));
    }
}

// funzione wrapper
export async function handleProgression(setters, stage) {
    await firstInstancePokemon("player", setters, stage);
    await firstInstancePokemon("enemy", setters, stage);
}


//funzione che bilancia il gioco
export function getEnemyLevel(stage) {
    return 3 + stage;
}


export async function spawnNewEnemy(newStage, { setEnemy, setEnemyStats, initializeMoveset, getEnemyLevel }) {
    const pokeId = generateRandomId(idLimit);
    const poke = await fetchFromApi("pokemon", pokeId);
    const enemyLevel = getEnemyLevel(newStage);

    // calcolo stats corrette
    const enemyStatsObj = calcStats(poke.stats, enemyLevel);

    // creo il pokemon
    const newEnemy = createPokemon({ id: pokeId, level: enemyLevel, data: poke });
    newEnemy.currentHp = enemyStatsObj.hp;
    newEnemy.maxHp = enemyStatsObj.hp;

    setEnemy(newEnemy);
    setEnemyStats(enemyStatsObj);

    const moveNames = await initializeMoveset(newEnemy, 2);
    setEnemy(prev => ({
        ...prev,
        moveset: moveNames
    }));
}


export function incrementStage(n, { setStage }) {
    setStage(prev => prev + n);
}

//qua puoi bilanciare il gioco aumentando l'exp data dai nemici
// setters = oggetto contenente i setter di React (qui solo setPlayer)
export function generateReward(stage, beatenEnemy, setters) {
    const { setPlayer } = setters;

    const finalReward = beatenEnemy.data.base_experience * (1 + stage / 4);

    setPlayer(prev => {
        const newExp = (prev.exp || 0) + finalReward; // protezione se prev.exp non esiste
        return { ...prev, exp: newExp };
    });

    return finalReward;
}