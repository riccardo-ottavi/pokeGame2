import './App.css'
import { useEffect, useState } from 'react';

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
  const baseUrl = "https://pokeapi.co/api/v2/"
  //qui puoi decidere entro quale id spawnano i pokemon (puoi in futuro far decidere al player)
  const idLimit = 1000;

  const typesEfficacy = [
    {
      type: "normal",
      super: [],
      notVery: ["rock", "steel"],
      noEff: ["ghost"]
    },
    {
      type: "fire",
      super: ["grass", "ice", "bug", "steel"],
      notVery: ["fire", "water", "rock", "dragon"],
      noEff: []
    },
    {
      type: "water",
      super: ["fire", "ground", "rock"],
      notVery: ["water", "grass", "dragon"],
      noEff: []
    },
    {
      type: "electric",
      super: ["water", "flying"],
      notVery: ["electric", "grass", "dragon"],
      noEff: ["ground"]
    },
    {
      type: "grass",
      super: ["water", "ground", "rock"],
      notVery: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
      noEff: []
    },
    {
      type: "ice",
      super: ["grass", "ground", "flying", "dragon"],
      notVery: ["fire", "water", "ice", "steel"],
      noEff: []
    },
    {
      type: "fighting",
      super: ["normal", "ice", "rock", "dark", "steel"],
      notVery: ["poison", "flying", "psychic", "bug", "fairy"],
      noEff: ["ghost"]
    },
    {
      type: "poison",
      super: ["grass", "fairy"],
      notVery: ["poison", "ground", "rock", "ghost"],
      noEff: ["steel"]
    },
    {
      type: "ground",
      super: ["fire", "electric", "poison", "rock", "steel"],
      notVery: ["grass", "bug"],
      noEff: ["flying"]
    },
    {
      type: "flying",
      super: ["grass", "fighting", "bug"],
      notVery: ["electric", "rock", "steel"],
      noEff: []
    },
    {
      type: "psychic",
      super: ["fighting", "poison"],
      notVery: ["psychic", "steel"],
      noEff: ["dark"]
    },
    {
      type: "bug",
      super: ["grass", "psychic", "dark"],
      notVery: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
      noEff: []
    },
    {
      type: "rock",
      super: ["fire", "ice", "flying", "bug"],
      notVery: ["fighting", "ground", "steel"],
      noEff: []
    },
    {
      type: "ghost",
      super: ["psychic", "ghost"],
      notVery: ["dark"],
      noEff: ["normal"]
    },
    {
      type: "dragon",
      super: ["dragon"],
      notVery: ["steel"],
      noEff: ["fairy"]
    },
    {
      type: "dark",
      super: ["psychic", "ghost"],
      notVery: ["fighting", "dark", "fairy"],
      noEff: []
    },
    {
      type: "steel",
      super: ["ice", "rock", "fairy"],
      notVery: ["fire", "water", "electric", "steel"],
      noEff: []
    },
    {
      type: "fairy",
      super: ["fighting", "dragon", "dark"],
      notVery: ["fire", "poison", "steel"],
      noEff: []
    }
  ];

  //----------classi---------------

  //inizializza classe per istanziare i pokemon effettivamente in gioco
  class PokemonInstance {
    constructor(id, level, maxHp, currentHp, status, data, exp) {
      this.id = id;
      this.level = level;
      this.maxHp = maxHp;
      this.currentHp = currentHp;
      this.status = [];
      this.volatileStatus = [];
      this.data = data;
      this.exp = exp;
      this.expToNextLevel = Math.pow(this.level, 3);
      this.statModifiers = {
        attack: 0,
        defense: 0,
        speed: 0,
        spAttack: 0,
        spDefense: 0,
        accuracy: 0,
        evasion: 0
      };
    }
  }

  class Modifiers {
    constructor(attacker, defender, move) {
      this.attacker = attacker;
      this.defender = defender;
      this.move = move;
    }
  }

  //gestisce la logica dei calcoli relativi alle statistiche
  class Stats {
    constructor(baseStat, level) {
      this.baseStat = baseStat;
      this.level = level;
    }
    get hp() {
      return this.calcHp();
    }
    get speed() {
      return this.calcSpeed();
    }
    get attack() {
      return this.calcAttack();
    }
    get defense() {
      return this.calcDefense();
    }
    calcHp() {
      return Math.floor((2 * this.baseStat[0].base_stat * this.level) / 100) + this.level + 10;
    }
    calcSpeed() {
      return Math.floor((2 * this.baseStat[5].base_stat * this.level) / 100 + 5);
    }
    calcAttack() {
      return Math.floor((2 * this.baseStat[1].base_stat * this.level) / 100 + 5);
    }
    calcDefense() {
      return Math.floor((2 * this.baseStat[2].base_stat * this.level) / 100 + 5);
    }
  }

  //gestisce la logica degli oggetti
  class Items {
    constructor(data, outcomeText, healing) {
      this.data = data;
      this.outcomeText = outcomeText;
      this.healing = healing;
      this.name = this.data.name;
      this.isItem = true;
    }
  }

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
    if (enemy.currentHp <= 0) {
      console.log("Complimenti!", enemy.data.name, "è esausto");
      generateReward(stage, enemy, player);
      incrementStage(1);
    }
  }, [enemy.currentHp, isGameOver]);

  useEffect(() => {
    if (player.currentHp <= 0) {
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
    //capisci se stai impostando player o enemy e assegna pokemon fetchato allo stato 
    if (target === "player") {
      //istanzia un pokemon a caso
      const pokeId = generateRandomId(idLimit)
      const poke = await fetchFromApi("pokemon", pokeId);

      //inizializza le statistiche in base al livello (inizialmente 5)
      const playerStats = new Stats(poke.stats, 5);

      const instanciatedPlayer = new PokemonInstance(pokeId, 5, playerStats.hp, playerStats.hp, null, poke, 0);
      setPlayer(instanciatedPlayer)
      setPlayerStats(playerStats)
      initializeMoveset(instanciatedPlayer, 2, "player")
      initializeItems("player", instanciatedPlayer);

    } else {
      //istanzia un pokemon a caso
      const pokeId = generateRandomId(idLimit)
      const poke = await fetchFromApi("pokemon", pokeId);

      //inizializza le statistiche in base al livello (inizialmente 5)
      const enemyLevel = getEnemyLevel(stage)
      const enemyStats = new Stats(poke.stats, enemyLevel);

      const instanciatedEnemy = new PokemonInstance(pokeId, getEnemyLevel(stage), enemyStats.hp, enemyStats.hp, null, poke, 0);
      setEnemy(instanciatedEnemy)
      setEnemyStats(enemyStats)
      initializeMoveset(instanciatedEnemy, 4, "enemy")
    }
  }

  function instanciatePoke(playerInstance, newLevel, bonusExp) {
    const pokeData = playerInstance.data;

    const oldMaxHp = playerInstance.maxHp;
    const oldCurrentHp = playerInstance.currentHp;

    const newStats = new Stats(pokeData.stats, newLevel);
    const newMaxHp = newStats.hp;

    const hpIncrease = newMaxHp - oldMaxHp;
    const newCurrentHp = Math.min(
      newMaxHp,
      oldCurrentHp + hpIncrease
    );

    const newPlayer = new PokemonInstance(
      pokeData.id,
      newLevel,
      newMaxHp,
      newCurrentHp,
      playerInstance.status,
      pokeData,
      bonusExp
    );

    setPlayer(newPlayer);
    setPlayerStats(newStats);
  }

  //fetcha qualcosa
  async function fetchFromApi(category, id) {
    const requestedPromise = await fetchJson(`${baseUrl}${category}/${id}`)
    return requestedPromise
  }

  async function spawnNewEnemy(newStage) {
    const pokeId = generateRandomId(idLimit);
    const poke = await fetchFromApi("pokemon", pokeId);
    const enemyLevel = getEnemyLevel(newStage);
    const enemyStats = new Stats(poke.stats, enemyLevel);

    const newEnemy = new PokemonInstance(
      pokeId,
      enemyLevel,
      enemyStats.hp,
      enemyStats.hp,
      null,
      poke,
      0
    );

    setEnemy(newEnemy);
    setEnemyStats(enemyStats);
    initializeMoveset(newEnemy, 2, "enemy");
  }

  //inizializza il moveset 
  async function initializeMoveset(pokemon, movesNumber, target) {
    let maxRange = pokemon.data.moves.length;
    let randomInt = Math.floor(Math.random() * maxRange);

    pokemon.moveset = [];
    for (let i = 0; i < movesNumber; i++) {
      let moveName;
      do {
        const randomInt = Math.floor(Math.random() * pokemon.data.moves.length);
        moveName = pokemon.data.moves[randomInt].move.name;
      } while (pokemon.moveset.includes(moveName));

      pokemon.moveset.push(moveName);
    }


    //le chiamate trasformano la stringa in oggetto completo con info mosse come PP o Potenza
    const promises = [];
    for (let i = 0; i < pokemon.moveset.length; i++) {
      const moveData = fetchFromApi("move", pokemon.moveset[i])
      promises.push(moveData)
    }
    const moves = await Promise.all(promises)
    const formattedMoves = moves.map(formatMove);

    if (target === "player") {
      setPlayerMoveSet(formattedMoves)
    } else {
      setEnemyMoveSet(formattedMoves)
    }

    return moves
  }

  //inizializza il moveset(andrà fatta una chiamata a /items)
  async function initializeItems() {
    const potion = await fetchFromApi("item", "potion")
    potion.quantity = 5;
    const hpPotion = new Items(potion, "You healed for", 20)
    setPlayerInv([hpPotion])
  }

  //------------fight system-------------

  function sendPlayerChoice(attacker, defencer, attackerMove, playerStats, enemyStats, enemyMoveSet) {
    //controlla chi è più veloce
    if (chechWhoFaster(playerStats, enemyStats)) {
      console.log("sei più veloce!")
      executePlayerTurn(attacker, defencer, playerStats, enemyStats, attackerMove)
      executeEnemyTurn(defencer, attacker, enemyMoveSet, playerStats, enemyStats)

    }
    else {
      console.log("sei più lento!")
      executeEnemyTurn(defencer, attacker, enemyMoveSet, playerStats, enemyStats)
      executePlayerTurn(attacker, defencer, playerStats, enemyStats, attackerMove)

    }
  }

  //controlla stato (paralizi, freeze ecc), usa mossa o item e poi applica status dmg(burn, poison ecc)
  function executePlayerTurn(player, enemy, playerStats, enemyStats, move) {
    if (!move) return;
    if (!startTurnStatusApply(player)) return;
    startTurnStatusApply(player);
    useMove(player, move, enemy, playerStats, enemyStats);
    endTurnStatusApply();
  }

  function executeEnemyTurn(enemy, player, enemyMoveSet, defenderStats, enemyStats) {
    if (!startTurnStatusApply(player)) return;
    startTurnStatusApply(enemy);
    useMove(enemy, enemyMoveSet[0], player, enemyStats, defenderStats)
    endTurnStatusApply();
  }

  //danni da status a fine turno
  function endTurnStatusApply() {
    if (player.status === "burn") {
      updateHp("player", "-", Math.floor(player.maxHp / 8));
    }
    if (enemy.status === "burn") {
      updateHp("enemy", "-", Math.floor(enemy.maxHp / 8));
    }

    // Poison
    if (player.status === "poison") {
      updateHp("player", "-", Math.floor(player.maxHp / 8));
    }
    if (enemy.status === "poison") {
      updateHp("enemy", "-", Math.floor(enemy.maxHp / 8));
    }

  }

  //ritorna true se riesce a fare la mossa o false se rimane bloccato dallo stato
  function startTurnStatusApply(pokemon) {
    console.log("status pokemon: ", pokemon.status, "status volatile pokemon: ", pokemon.volatileStatus);
    if (!handleVolatileStatus(pokemon)) return false;
    const random = generateRandomId(100);

    switch (pokemon.status) {
      case "paralysis":
        if (random <= 25) {
          console.log(pokemon.data.name, "salta il turno (paralisi)!");
          return false; //turno salta
        }
        break;

      case "freeze":
        if (pokemon.status === "freeze") {
          if (random <= 20) {
            pokemon.status = null; // si scongela
            console.log(pokemon.data.name, "si è scongelato!");
            return true;
          } else {
            console.log(pokemon.data.name, "è congelato e salta il turno!");
            return false;
          }
        }
        break;

      case "sleep":
        if (pokemon.status?.type === "sleep") {
          if (pokemon.status.turns > 0) {
            decrementSleep(pokemon);
            return false;
          } else {
            clearStatus(pokemon);
            return true;
          }
        }

        break;

      case "burn":
        if (pokemon === player) {
          setPlayer(prev => ({
            ...prev,
            statModifiers: {
              ...prev.statModifiers,
              attack: -1
            }
          }));
        } else {
          setEnemy(prev => ({
            ...prev,
            statModifiers: {
              ...prev.statModifiers,
              attack: -1
            }
          }));
        }
    }

    console.log(pokemon.data.name, "fa il turno normalmente");
    return true;
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

function formatStatus(type) {
  return {type}
}

  function decrementSleep() {
    if (target === player) {
      setPlayer(prev => {
        return { ...prev, turns: turns - 1 }
      });
    } else {
      setEnemy(prev => {
        return { ...prev, turns: turns - 1 }
      });
    }
  }

  function clearVolatileStatus(pokemon, target) {
    if (target === player) {
      setPlayer(prev => {
        return { ...prev, volatileStatus: null }
      });
    } else {
      setEnemy(prev => {
        return { ...prev, volatileStatus: null }
      });
    }
  }

  //funzione principale del fight system, riceve una mossa o oggetto e sceglie come procedere 
  function useMove(attacker, move, defender, attackerStats, defenderStats) {

    if (attacker.status !== null) {
      statusHandler(attacker)
    }

    if (!move) return;
    if (attacker.currentHp <= 0) return;

    //controlli validità mossa
    if (move.isItem) {
      //qui sei sicuro che hai inviato un oggetto
      useItem(move)

      return
    }

    move.effects.forEach(effect => {
  if (effect.kind === "persistent") {
    const status = formatStatus(effect.type);
    setEnemy(prev => applyStatus(prev, status));
  }

  if (effect.kind === "volatile") {
    const volatile = formatVolatileStatus(effect.type, effect.turns);
    setEnemy(prev => applyVolatileEffect(prev, volatile));
  }
});

    console.log(
      attacker.data.name,
      "deals",
      trueDmgCalculator(attacker, attackerStats, defenderStats, move, defender),
      "to",
      defender.data.name,
      "using",
      move.name
    );

    //applica eventuali danni
    updateHp(
      defender === player ? "player" : "enemy",
      "-",
      trueDmgCalculator(attacker, attackerStats, defenderStats, move, defender)
    );
  }

  function applyEffects(effects, attacker, defender) {
    effects.forEach(effect => {
      const target =
        effect.target === "user" ? attacker : defender;

      switch (effect.kind) {
        case "stat-change":
          applyStatChange(target, effect.stat, effect.amount);
          break;

        case "status":
          applyStatus(target, effect.status, 100);
          break;
      }
    });
  }

  //verifica se lo status entra e capisce a chi assegnarlo
  function applyStatus(target, newStatus, chance) {
    if (pokemon.status !== null) return pokemon;
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

  function statusHandler(pokemon) {
    switch (pokemon.status) {
      case "poison":
        updateHp(
          pokemon === player ? "player" : "enemy",
          "-",
          Math.floor(pokemon.maxHp / 8)
        );
        break;

      case "paralysis":
        // 25% di saltare il turno
        break;
    }
  }

  //dimmi che tipo di effetto produce e con quali parametri 
  function buildEffects(move) {
    const effects = [];

    if (move.meta?.ailment && move.meta.ailment.name !== "none") {
      const kind = move.meta.ailment.name === "confusion" ? "volatile-status" : "status";
      effects.push({
        kind,
        status: move.meta.ailment.name,
        chance: move.meta.ailment_chance,
        target: move.target.name
      });
    }

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

  function decrementConfusion() {
    if (target === player) {
      setPlayer(prev => {
        return { ...prev, turns: turns - 1 }
      });
    } else {
      setEnemy(prev => {
        return { ...prev, turns: turns - 1 }
      });
    }
  }

  function clearVolatileStatus(pokemon, target) {
    if (target === player) {
      setPlayer(prev => {
        return { ...prev, volatileStatus: null }
      });
    } else {
      setEnemy(prev => {
        return { ...prev, volatileStatus: null }
      });
    }
  }

  function handleVolatileStatus(pokemon) {
    //confusione
    if (pokemon.volatileStatus?.type === "confusion") {
      if (pokemon.volatileStatus.turns > 0) {
        decrementConfusion(pokemon);
        return false;
      } else {
        clearVolatileStatus(pokemon);
        return true;
      }
    }
    //controlla altri stati volatili (tipo flinch)
    if (pokemon.volatileStatus.includes("flinch")) {
      console.log(`${pokemon.data.name} subisce Flinch e salta il turno!`);
      // rimuove flinch dopo averlo applicato
      if (pokemon === player) {
        setPlayer(prev => ({
          ...prev,
          volatileStatus: prev.volatileStatus.filter(e => e !== "flinch")
        }));
      } else {
        setEnemy(prev => ({
          ...prev,
          volatileStatus: prev.volatileStatus.filter(e => e !== "flinch")
        }));
      }
      return false; // turno saltato
    }

    return true;
  }

  function evaluateModifiers(attackerStats, defenderStats, move, attacker, defender) {
    let dmgMoltiplier = 1;
    //verifica se la mossa fallisce doMovesFail()
    const random = generateRandomId(100);
    if (random >= move.accuracy) {
      console.log("la mossa fallisce!")
      return 0
    }

    //verifica se la mossa fa brutto colpo isCritical()
    const random2 = generateRandomId(16);
    if (random2 <= 1) {
      console.log("Brutto colpo!")
      return dmgMoltiplier *= 1.5
    }

    const moveType = move.type?.name;
    const defenderTypes = defender.data.types.map(t => t.type.name);

    const thisEfficacies = typesEfficacy.find(t => t.type === moveType);
    if (!thisEfficacies) return dmgMoltiplier;

    //verifica se la mossa è STAB
    const attackerTypes = attacker.data.types.map(t => t.type.name);
    if (attackerTypes.includes(moveType)) {
      console.log("E' STAB!");
      dmgMoltiplier *= 1.5;
    }

    defenderTypes.forEach(defType => {
      if (thisEfficacies.noEff.includes(defType)) {
        console.log("Non ha effetto!");
        dmgMoltiplier *= 0;
      } else if (thisEfficacies.super.includes(defType)) {
        console.log("È superefficace!");
        dmgMoltiplier *= 2;
      } else if (thisEfficacies.notVery.includes(defType)) {
        console.log("Non è molto efficace...");
        dmgMoltiplier *= 0.5;
      }
    });

    return dmgMoltiplier
  }


  function enemyIa(enemy, player, enemyMoveSet,) {

  }

  function updateHp(target, operator, amount) {
    const setter = target === "player" ? setPlayer : setEnemy;
    setter(prev => {
      const newHp =
        operator === "+"
          ? prev.currentHp + amount
          : prev.currentHp - amount;

      return {
        ...prev,
        currentHp: Math.max(0, Math.min(prev.maxHp, newHp))
      };
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
  function renderRunRecap(player, enemy, stage) {

  }

  //stabilisce se una mossa applica un effetto volatile o persistente
  function isVolatileEffect() {

  }

  function incrementStage(n) {
    setStage(prev => prev + n);
  }

  //----------utilities---------------
  // id casuale per randomizzare da 0 a un limite 
  function generateRandomId(max) {
    const random = Math.round(Math.random() * max);
    return random
  }

  //parsa le response in obj JSON
  async function fetchJson(url) {
    const response = await fetch(url);
    const obj = await response.json();
    return obj
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

  //serve a gestire i danni quando le stats sono buffate
  function getStageMultiplier(stage) {
    if (stage >= 0) return (2 + stage) / 2;
    return 2 / (2 - stage);
  }

  //funzione che bilancia il gioco
  function getEnemyLevel(stage) {
    return 3 + stage;
  }

  //main(---tests----)
  //runGame()

  console.log("player: ", player, "enemy: ", enemy);

  return (
    <>
      {!isGameOver &&
        <div className="container">
          <div>STAGE: {stage}</div>
          <p>{player.currentHp} / {player.maxHp}</p>
          <p>{enemy.currentHp} / {enemy.maxHp}</p>
          <img src={player.data?.sprites?.front_default} alt="" />
          <img src={enemy.data?.sprites?.front_default} alt="" />
          {playerMoveSet.map(move => (
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
          <button onClick={() => sendPlayerChoice(player, enemy, selectedMove, playerStats, enemyStats, enemyMoveSet)}>Confirm</button>
          <p>Mossa attiva: {selectedMove?.name}</p>
          <button onClick={() => startNewRun()}>Resetta Run</button>
        </div>
      }
      {isGameOver &&
        <div className="container">
          <h2>HAI PERSO!</h2>
          <p>Stage raggiunto: {stage}</p>
          <button onClick={() => startNewRun()}>Nuova run</button>
        </div>
      }
    </>
  )
}

export default App
