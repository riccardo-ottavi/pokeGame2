import './App.css'
import { useEffect, useState } from 'react';
import { typesEfficacy, idLimit } from './constants.js';
import { fetchFromApi, fetchJson, generateRandomId } from './utils/api.js';
import { calcStats, getStageMultiplier, evaluateModifiers, trueDmgCalculator, } from './utils/stats.js';
import { createPokemon, createItem, instanciatePoke } from './utils/pokemonFactory.js';
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

  //inizializza il moveset 
  async function initializeMoveset(pokemon, movesNumber) {
    const moveset = [];

    while (moveset.length < movesNumber) {
      const randomIndex = Math.floor(Math.random() * pokemon.data.moves.length);
      const moveUrl = pokemon.data.moves[randomIndex].move.url;

      if (!moveset.find(m => m.url === moveUrl)) {
        const moveData = await fetchJson(moveUrl);
        moveset.push(formatMove(moveData));
      }
    }

    return moveset;
  }

  //inizializza il moveset(andrà fatta una chiamata a /items)
  async function initializeItems() {
    const potion = await fetchFromApi("item", "potion")
    potion.quantity = 5;
    const hpPotion = createItem(potion, "You healed for", 20);
    setPlayerInv([hpPotion]);
  }

  //------------fight system-------------

  function sendPlayerChoice(attackerName, defenderName, move, playerStats, enemyStats) {
  if (chechWhoFaster(playerStats, enemyStats)) {
    executePlayerTurn(attackerName, defenderName, playerStats, enemyStats, move);
    executeEnemyTurn(defenderName, attackerName, playerStats, enemyStats);
  } else {
    executeEnemyTurn(defenderName, attackerName, playerStats, enemyStats);
    executePlayerTurn(attackerName, defenderName, playerStats, enemyStats, move);
  }
}

  //controlla stato (paralizi, freeze ecc), usa mossa o item e poi applica status dmg(burn, poison ecc)
  function executePlayerTurn(attackerName, defenderName, playerStats, enemyStats, move) {
    if (!move) return;
    if (!processTurnStatus(attackerName === "player" ? player : enemy)) return;
    useMove(attackerName === "player" ? player : enemy, move, defenderName, playerStats, enemyStats);
  }

  function executeEnemyTurn(attackerName, defenderName, defenderStats, attackerStats) {
  const attacker = attackerName === "player" ? player : enemy;
  const defender = defenderName === "player" ? player : enemy;
  if (!processTurnStatus(attacker)) return;

  const move = attacker.moveset?.[0]; // prende la prima mossa disponibile
  if (!move) return;

  useMove(attacker, move, defenderName, attackerStats, defenderStats);
}


  function clearStatus(pokemon) {
    if (pokemon === player) setPlayer(prev => ({ ...prev, status: null }));
    else setEnemy(prev => ({ ...prev, status: null }));
  }

  function removeVolatileStatus(pokemon, type) {
    if (pokemon === player) setPlayer(prev => ({
      ...prev,
      volatileStatus: prev.volatileStatus.filter(v => v.type !== type)
    }));
    else setEnemy(prev => ({
      ...prev,
      volatileStatus: prev.volatileStatus.filter(v => v.type !== type)
    }));
  }


  function formatMove(move) {
    return {
      id: move.id,
      name: move.name,
      power: move.power,
      accuracy: move.accuracy,
      category: move.damage_class.name,
      type: move.type.name,

      effects: buildEffects(move)
    };
  }

  function formatVolatileStatus(type, turns) {
    return {
      type,
      turns
    };
  }

  //funzione principale del fight system, riceve una mossa o oggetto e sceglie come procedere 
  function useMove(attacker, move, defenderName, attackerStats, defenderStats) {
    if (!move) return;
    if (attacker.currentHp <= 0) return;

    if (move.isItem) {
      useItem(move);
      return;
    }

    const defender = defenderName === "player" ? player : enemy;

    const damage = trueDmgCalculator(attacker, attackerStats, defenderStats, move, defender);
    updateHp(defenderName, "-", damage);

    console.log(`${attacker.data.name} usa ${move.name} e infligge ${damage} danni a ${defender.data.name}`);
  }

  //verifica se lo status entra e capisce a chi assegnarlo
  function applyStatus(target, newStatus, chance) {
    if (target.status !== null) return target;
    if (chance >= generateRandomId(100)) {
      if (target === player) {
        setPlayer(prev => ({
          ...prev,
          status: newStatus
        }));

      } else if (target === enemy) {
        setEnemy(prev => ({
          ...prev,
          status: newStatus
        }));
      }
    }
  }

  //dimmi che tipo di effetto produce e con quali parametri 
  function buildEffects(move) {
    const effects = [];

    // 1️⃣ Status / Volatile status
    if (move.meta?.ailment && move.meta.ailment.name !== "none") {
      const isVolatile = move.meta.ailment.name === "confusion";
      effects.push({
        kind: isVolatile ? "volatile-status" : "status",
        type: move.meta.ailment.name,
        chance: move.meta.ailment_chance || 100,
        target: move.target.name
      });
    }

    // 2️⃣ Modificatori di stat
    if (move.stat_changes?.length > 0) {
      move.stat_changes.forEach(sc => {
        effects.push({
          kind: "stat-change",
          stat: sc.stat.name,
          amount: sc.change,
          target: move.target.name
        });
      });
    }

    return effects;
  }



  //applica cambiamenti alle statistiche 
  function applyStatChange(target, stat, amount) {

    if (target.data.name === player.data.name) {
      setPlayer(prev => {
        const newStages = { ...prev.statModifiers };
        newStages[stat] = Math.max(-6, Math.min(6, newStages[stat] + amount));

        return {
          ...prev,
          statModifiers: newStages
        };
      });
    } else {
      setEnemy(prev => {
        const newStages = { ...prev.statModifiers };
        newStages[stat] = Math.max(-6, Math.min(6, newStages[stat] + amount));

        return {
          ...prev,
          statModifiers: newStages
        };
      });
    }
  }

  function applyVolatileEffect(pokemon, volatileStatus) {
    const alreadyPresent = pokemon.volatileStatus
      ?.some(s => s.type === volatileStatus.type);

    if (alreadyPresent) return pokemon;

    return {
      ...pokemon,
      volatileStatus: [
        ...(pokemon.volatileStatus || []),
        volatileStatus
      ]
    };
  }

  function handleVolatileStatus(pokemon) {
    // --- CONFUSIONE ---
    const confusionIndex = pokemon.volatileStatus.findIndex(s => s.type === "confusion");
    if (confusionIndex !== -1) {
      const confusion = pokemon.volatileStatus[confusionIndex];

      if (confusion.turns > 0) {
        // decrementa i turni
        const newTurns = confusion.turns - 1;
        if (pokemon === player) {
          setPlayer(prev => ({
            ...prev,
            volatileStatus: prev.volatileStatus.map((s, i) =>
              i === confusionIndex ? { ...s, turns: newTurns } : s
            )
          }));
        } else {
          setEnemy(prev => ({
            ...prev,
            volatileStatus: prev.volatileStatus.map((s, i) =>
              i === confusionIndex ? { ...s, turns: newTurns } : s
            )
          }));
        }

        // 50% di chance di colpirsi da solo
        if (generateRandomId(100) < 50) {
          const selfDamage = Math.floor(pokemon.maxHp / 8);
          console.log(`${pokemon.data.name} è confuso e si danneggia da solo!`);
          updateHp(pokemon === player ? "player" : "enemy", "-", selfDamage);
          return false; // turno saltato
        }

        console.log(`${pokemon.data.name} è confuso ma agisce normalmente!`);
        return true; // il Pokémon può usare la mossa
      } else {
        // rimuove la confusione quando i turni finiscono
        if (pokemon === player) {
          setPlayer(prev => ({
            ...prev,
            volatileStatus: prev.volatileStatus.filter((_, i) => i !== confusionIndex)
          }));
        } else {
          setEnemy(prev => ({
            ...prev,
            volatileStatus: prev.volatileStatus.filter((_, i) => i !== confusionIndex)
          }));
        }
        console.log(`${pokemon.data.name} non è più confuso!`);
        return true;
      }
    }

    // --- FLINCH ---
    const flinchIndex = pokemon.volatileStatus.findIndex(s => s.type === "flinch");
    if (flinchIndex !== -1) {
      console.log(`${pokemon.data.name} subisce Flinch e salta il turno!`);
      // rimuove flinch subito dopo
      if (pokemon === player) {
        setPlayer(prev => ({
          ...prev,
          volatileStatus: prev.volatileStatus.filter((_, i) => i !== flinchIndex)
        }));
      } else {
        setEnemy(prev => ({
          ...prev,
          volatileStatus: prev.volatileStatus.filter((_, i) => i !== flinchIndex)
        }));
      }
      return false; // turno saltato
    }

    return true; // nessuno stato volatile blocca il turno
  }

  

  function updateHp(target, operator, amount) {
    const setter = target === "player" ? setPlayer : setEnemy;

    setter(prev => {
      const newHp = operator === "+"
        ? Math.min(prev.maxHp, prev.currentHp + amount)
        : Math.max(0, prev.currentHp - amount);

      console.log(`${prev.data.name} HP: ${prev.currentHp} → ${newHp}`);

      return { ...prev, currentHp: newHp };
    });
  }
  //se il player è più veloce ritorna true
  function chechWhoFaster(playerStats, enemyStats) {
    if (playerStats.speed > enemyStats.speed) {
      return true
    } else {
      return false
    }
  }

  function useItem(item) {
    console.log("Hai usato l' oggetto: ", item.name);
    updateHp("player", "+", item.healing);
  }

  //----------progressione---------------

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

  function processTurnStatus(pokemon) {
    let canAct = true; // assume che il Pokémon possa agire

    // --- 1️⃣ Volatile Status ---
    if (pokemon.volatileStatus?.length) {
      // itera tutti i volatili
      for (let i = pokemon.volatileStatus.length - 1; i >= 0; i--) {
        const volatile = pokemon.volatileStatus[i];

        switch (volatile.type) {
          case "confusion":
            if (volatile.turns > 0) {
              // decrementa i turni
              if (pokemon === player) {
                setPlayer(prev => ({
                  ...prev,
                  volatileStatus: prev.volatileStatus.map((s, i) =>
                    i === i ? { ...s, turns: s.turns - 1 } : s
                  )
                }));
              } else {
                setEnemy(prev => ({
                  ...prev,
                  volatileStatus: prev.volatileStatus.map((s, i) =>
                    i === i ? { ...s, turns: s.turns - 1 } : s
                  )
                }));
              }
              if (generateRandomId(100) < 50) {
                // si danneggia da solo
                const selfDamage = Math.floor(pokemon.maxHp / 8);
                console.log(`${pokemon.data.name} è confuso e si danneggia da solo!`);
                updateHp(pokemon === player ? "player" : "enemy", "-", selfDamage);
                canAct = false;
              } else {
                console.log(`${pokemon.data.name} è confuso ma agisce normalmente`);
              }
            } else {
              // rimuove la confusione
              removeVolatileStatus(pokemon, "confusion");
              console.log(`${pokemon.data.name} non è più confuso!`);
            }
            break;

          case "flinch":
            console.log(`${pokemon.data.name} subisce Flinch e salta il turno!`);
            removeVolatileStatus(pokemon, "flinch");
            canAct = false;
            break;

          // qui puoi aggiungere altri volatili tipo "taunt", "disable" ecc.
        }
      }
    }

    // --- 2️⃣ Persistent Status ---
    if (pokemon.status) {
      switch (pokemon.status.type) {
        case "paralysis":
          if (generateRandomId(100) <= 25) {
            console.log(`${pokemon.data.name} è paralizzato e salta il turno!`);
            canAct = false;
          }
          break;

        case "sleep":
          if (pokemon.status.turns > 0) {
            pokemon.status.turns -= 1;
            console.log(`${pokemon.data.name} dorme ancora (${pokemon.status.turns} turni rimasti)`);
            canAct = false;
          } else {
            clearStatus(pokemon);
            console.log(`${pokemon.data.name} si sveglia!`);
          }
          break;

        case "freeze":
          if (generateRandomId(100) <= 20) {
            clearStatus(pokemon);
            console.log(`${pokemon.data.name} si è scongelato!`);
          } else {
            console.log(`${pokemon.data.name} è congelato e salta il turno!`);
            canAct = false;
          }
          break;

        case "burn":
        case "poison":
          // danni da status applicati all'inizio del turno
          const dmg = Math.floor(pokemon.maxHp / 8);
          console.log(`${pokemon.data.name} subisce danno da ${pokemon.status.type}: ${dmg}`);
          updateHp(pokemon === player ? "player" : "enemy", "-", dmg);
          break;
      }
    }

    // --- 3️⃣ Stat modifiers da burn ---
    if (pokemon.status?.type === "burn") {
      // -1 attack
      if (pokemon === player) {
        setPlayer(prev => ({
          ...prev,
          statModifiers: {
            ...prev.statModifiers,
            attack: Math.max(-6, prev.statModifiers.attack - 1)
          }
        }));
      } else {
        setEnemy(prev => ({
          ...prev,
          statModifiers: {
            ...prev.statModifiers,
            attack: Math.max(-6, prev.statModifiers.attack - 1)
          }
        }));
      }
    }

    return canAct;
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
            <button onClick={() => sendPlayerChoice("player", "enemy", selectedMove, playerStats, enemyStats)}>Confirm</button>
          </div>
        </div>
      }
      {isGameOver &&
        <div className="container">
          <h2>HAI PERSO!</h2>
          <p>Stage raggiunto: {stage}</p>
          <button onClick={() => startNewRun()}>Nuova run</button>
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
