import './App.css'
import { useEffect, useState } from 'react';
import { typesEfficacy, idLimit } from './constants.js';
import { fetchFromApi, fetchJson, generateRandomId } from './utils/api.js';
import { calcStats, getStageMultiplier, evaluateModifiers, trueDmgCalculator, } from './utils/stats.js';
import { createPokemon, createItem, instanciatePoke } from './utils/pokemonFactory.js';
import { formatMove, buildEffects, initializeMoveset } from './utils/moves.js';
import { processTurnStatus, handleVolatileStatus, applyStatus, applyVolatileEffect, removeVolatileStatus } from './utils/status.js';
import { sendPlayerChoice, executeEnemyTurn, executePlayerTurn } from './utils/fightSystem.js';
import { firstInstancePokemon, spawnNewEnemy, handleProgression, generateReward } from './utils/progression.js';
import { incrementStage, getEnemyLevel } from './utils/progression.js';
import { updateHp } from './utils/fightSystem.js';

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
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)

  const [selectedMove, setSelectedMove] = useState()

  //----------costanti---------------

  const setters = { setPlayer, setEnemy, updateHp, clearStatus, removeVolatileStatus };
  //effetti
  useEffect(() => {
    handleProgression();
  }, [])

  // cambio stage → nuovo nemico
  useEffect(() => {
    if (stage > 1 && !isGameOver) {
      spawnNewEnemy(stage, {
        setEnemy,
        setEnemyStats,
        initializeMoveset,
        getEnemyLevel
      });

    }
  }, [stage]);

  useEffect(() => {
    handleProgression({
      setPlayer,
      setPlayerStats,
      setEnemy,
      setEnemyStats,
      initializeItems
    }, stage);
  }, []);


  // Enemy muore → incrementa stage e spawn nuovo nemico
  useEffect(() => {
    if (enemy?.currentHp <= 0 && enemy?.data) {
      console.log("Complimenti!", enemy.data.name, "è esausto");

      // Passiamo i setter invece del player
      generateReward(stage, enemy, { setPlayer });

      incrementStage(1, { setStage });
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

    // check level up
    if (player.exp >= player.expToNextLevel) {
      const bonusExp = player.exp - player.expToNextLevel;
      const { newPlayer, newStats } = instanciatePoke(player, player.level + 1, bonusExp);
      setPlayer(newPlayer);
      setPlayerStats(newStats);
    }
  }, [player.exp]);

  function handlePlayerMove() {
    if (processTurnStatus(player, setters)) {
      // può usare la mossa
      if (!selectedMove) return;
      if (player.currentHp <= 0) return; // Player già KO, niente mossa
      if (enemy.currentHp <= 0) return;  // Nemico già KO, niente mossa

      // turno player
      const result = sendPlayerChoice(player, enemy, selectedMove);
      if (!result) return;

      // aggiorna HP nemico
      setEnemy(prevEnemy => {
        const newHp = Math.max(0, prevEnemy.currentHp - result.damage);
        return { ...prevEnemy, currentHp: newHp };
      });

      // Se il nemico è KO, il turno del nemico non parte
      if (enemy.currentHp - result.damage <= 0) return;

      // turno nemico con delay
      setTimeout(() => {
        if (player.currentHp <= 0) return; // Player morto prima del contrattacco

        setPlayer(prevPlayer => {
          const enemyResult = executeEnemyTurn(enemy, prevPlayer, setters);
          if (!enemyResult) return prevPlayer;

          return {
            ...prevPlayer,
            currentHp: Math.max(0, prevPlayer.currentHp - enemyResult.damage)
          };
        });
      }, 500);
    }else{
      //non può attaccare
      console.log("il pokemon non attacca!")
    }

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



  function startNewRun() {
    setIsGameOver(false);
    setStage(1);
    setSelectedMove(null);
    setPlayerMoveSet([]);
    setEnemyMoveSet([]);
    setPlayerInv([]);
    handleProgression({
      setPlayer,
      setPlayerStats,
      setEnemy,
      setEnemyStats,
      initializeItems
    }, 1);
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
            <button onClick={handlePlayerMove}>Confirm</button>
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
