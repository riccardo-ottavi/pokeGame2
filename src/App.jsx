import './App.css'
import { useEffect, useState } from 'react';
import { typesEfficacy, idLimit } from './constants.js';
import { fetchFromApi, fetchJson, generateRandomId } from './utils/api.js';
import { calcStats, getStageMultiplier, evaluateModifiers, trueDmgCalculator, } from './utils/stats.js';
import { createPokemon, createItem, instanciatePoke } from './utils/pokemonFactory.js';
import { formatMove, buildEffects, initializeMoveset } from './utils/moves.js';
import { processTurnStatus, handleVolatileStatus, applyStatus, applyVolatileEffect, removeVolatileStatus } from './utils/status.js';
import { sendPlayerChoice, executeEnemyTurn, executePlayerTurn } from './utils/fightSystem.js';


import PlayerCard from './components/PlayerCard';

function App() {
  //----------stati---------------
  const [stage, setStage] = useState(1)
  const [isGameOver, setIsGameOver] = useState(false)
  const [player, setPlayer] = useState({})
  const [playerStats, setPlayerStats] = useState({})
  const [enemy, setEnemy] = useState({})
  const [enemyStats, setEnemyStats] = useState({})
  const [playerMoveSet, setPlayerMoveSet] = useState([])
  const [enemyMoveSet, setEnemyMoveSet] = useState([])
  const [playerInv, setPlayerInv] = useState([])

  const [selectedMove, setSelectedMove] = useState()

  //----------costanti---------------

  //effetti
  useEffect(() => {
    handleProgression();
  }, [])

  // cambio stage → nuovo nemico
  useEffect(() => {
    if (stage > 1 && !isGameOver) {
      spawnNewEnemy(stage);
    }
  }, [stage]);


  // Enemy muore → incrementa stage e spawn nuovo nemico
  useEffect(() => {
    if (enemy?.currentHp <= 0 && enemy?.data) {
      console.log("Complimenti!", enemy.data.name, "è esausto");
      generateReward(stage, enemy, player);
      incrementStage(1);
    }
  }, [enemy.currentHp, isGameOver]);

  useEffect(() => {
    if (player?.currentHp <= 0 && player?.data) {
      setIsGameOver(true);
      setStage(1);
    }
  }, [player.currentHp, isGameOver]);

  useEffect(() => {
    if (!player.exp) return;

    if (player.exp >= player.expToNextLevel) {
      const bonusExp = player.exp - player.expToNextLevel;
      instanciatePoke(player, player.level + 1, bonusExp);
    }
  }, [player.exp]);

  //----------inizializzazioni---------------

  //inizializza player e nemico con this. e gli aggiunge proprietà items e moveset
  async function firstInstancePokemon(target) {
    if (target === "player") {
      const pokeId = generateRandomId(idLimit)
      const poke = await fetchFromApi("pokemon", pokeId);

      const instanciatedPlayer = createPokemon({ id: pokeId, level: 5, data: poke });
      setPlayer(instanciatedPlayer);

      const playerStatsObj = calcStats(poke.stats, 5);
      setPlayerStats(playerStatsObj);

      const moveNames = await initializeMoveset(instanciatedPlayer, 2);
      setPlayer(prev => ({
        ...prev,
        moveset: moveNames
      }));

      initializeItems("player", instanciatedPlayer);

    } else { // nemico
      const pokeId = generateRandomId(idLimit);
      const poke = await fetchFromApi("pokemon", pokeId);

      const enemyLevel = getEnemyLevel(stage);

      // calcola stats corrette
      const enemyStatsObj = calcStats(poke.stats, enemyLevel);

      // crea il nemico
      const instanciatedEnemy = createPokemon({ id: pokeId, level: enemyLevel, data: poke });
      instanciatedEnemy.currentHp = enemyStatsObj.hp;
      instanciatedEnemy.maxHp = enemyStatsObj.hp;

      setEnemy(instanciatedEnemy);
      setEnemyStats(enemyStatsObj);

      const moveNames = await initializeMoveset(instanciatedEnemy, 2);
      setEnemy(prev => ({
        ...prev,
        moveset: moveNames
      }));
    }
  }


  function instanciatePoke(playerInstance, newLevel, bonusExp) {
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

  async function spawnNewEnemy(newStage) {
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

  //inizializza il moveset(andrà fatta una chiamata a /items)
  async function initializeItems() {
    const potion = await fetchFromApi("item", "potion")
    potion.quantity = 5;
    const hpPotion = createItem(potion, "You healed for", 20);
    setPlayerInv([hpPotion]);
  }


  function clearStatus(pokemon) {
    if (pokemon === player) setPlayer(prev => ({ ...prev, status: null }));
    else setEnemy(prev => ({ ...prev, status: null }));
  }

  function formatVolatileStatus(type, turns) {
    return {
      type,
      turns
    };
  }

  //genera la progressione in rapporto agli stage 
  async function handleProgression() {
    await firstInstancePokemon("player");
    await firstInstancePokemon("enemy");
  }

  function startNewRun() {
    setIsGameOver(false);
    setStage(1);
    setSelectedMove(null);
    setPlayerMoveSet([]);
    setEnemyMoveSet([]);
    setPlayerInv([]);
    handleProgression();
  }


  //qua puoi bilanciare il gioco aumentando l'exp data dai nemici
  function generateReward(stage, beatenEnemy, player) {
    const finalReward = beatenEnemy.data.base_experience * (1 + stage / 4);
    setPlayer(prev => {
      const newExp = prev.exp + finalReward;
      return { ...prev, exp: newExp };
    });

    return finalReward;
  }

  function incrementStage(n) {
    setStage(prev => prev + n);
  }

  function trueDmgCalculator(attacker, attackerStats, defenderStats, move, defender) {

    const effectiveAttack = attackerStats.attack * getStageMultiplier(attacker.statModifiers.attack)
    const effectiveDefense = defenderStats.defense * getStageMultiplier(defender.statModifiers.defense)

    const baseDamage =
      (((((2 * attacker.level) / 5 + 2) * move.power *
        effectiveAttack / effectiveDefense) / 50) + 2);

    const modifier = evaluateModifiers(
      attackerStats,
      defenderStats,
      move,
      attacker,
      defender
    );

    return Math.floor(baseDamage * modifier);
  }



  //funzione che bilancia il gioco
  function getEnemyLevel(stage) {
    return 3 + stage;
  }

  console.log("player: ", player, "enemy: ", enemy);

  return (
    <>
      {!isGameOver &&
        <div className="container">
          <div className="fight">
            <div className="player-healthbar-gray">
              <div className="player-healthbar-green">
                <p className='player-poke-name'>{player?.data?.name.toUpperCase()}</p>
                <p className='player-hp-text-numbs'>{player?.currentHp} / {player.maxHp}</p>
                <p className='player-level'>Lv: {player.level}</p>
              </div>
            </div>
            <div className="enemy-healthbar-gray">
              <div className="enemy-healthbar-green">
                <p className='enemy-poke-name'>{enemy?.data?.name.toUpperCase()}</p>
                <p className='enemy-level'>Lv: {enemy.level}</p>
              </div>
            </div>
            <div className="player-sprite">
              <img src={player.data?.sprites?.back_default} alt="" />
            </div>
            <div className="enemy-sprite">
              <img src={enemy.data?.sprites?.front_default} alt="" />
            </div>
          </div>
          <div className="bar">
            {player.moveset?.map(move => (
              <p
                onClick={() => setSelectedMove(move)}
                key={move.id}
              >{move.name}</p>

            ))}
            {playerInv.map(item => (
              <p
                onClick={() => setSelectedMove(item)}
                key={item.data.id}
              >{item.name}
              </p>
            ))}
            <button
              onClick={() => {
                if (!selectedMove) return;

                // turno player
                const result = sendPlayerChoice(player, enemy, selectedMove);
                if (!result) return;

                setEnemy(prev => {
                  const newHp = Math.max(0, prev.currentHp - result.damage);

                  // turno nemico subito dopo
                  setTimeout(() => {
                    const enemyResult = executeEnemyTurn(enemy, player);
                    if (enemyResult) {
                      setPlayer(prevPlayer => ({
                        ...prevPlayer,
                        currentHp: Math.max(0, prevPlayer.currentHp - enemyResult.damage)
                      }));
                    }
                  }, 500); // mezzo secondo di delay per vedere l'attacco

                  return { ...prev, currentHp: newHp };
                });
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      }
      {isGameOver &&
        <div className="container">
          <h2>HAI PERSO!</h2>
          <p>Stage raggiunto: {stage}</p>
        </div>
      }
      <div>STAGE: {stage}</div>
      <PlayerCard
        pokemon={player}
      />
    </>
  )
}

export default App
