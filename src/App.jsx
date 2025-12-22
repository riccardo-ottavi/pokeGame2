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
      this.status = status;
      this.data = data;
      this.exp = exp;
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
      this.healing = healing
    }
  }

  //test
  useEffect(() => {
    handleProgression();
  }, [])

  useEffect(() => {
    instancePokemon("enemy");
    setNewStage()
  }, [stage])

  //----------inizializzazioni---------------

  //inizializza player e nemico con this. e gli aggiunge proprietà items e moveset
  async function instancePokemon(target) {
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
      initializeMoveset(instanciatedPlayer, 4, "player")
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

  //fetcha qualcosa
  async function fetchFromApi(category, id) {
    const requestedPromise = await fetchJson(`${baseUrl}${category}/${id}`)
    return requestedPromise
  }

  //inizializza il moveset 
  async function initializeMoveset(pokemon, movesNumber, target) {
    pokemon.moveset = [];
    for (let i = 0; i < movesNumber; i++) {
      const moveName = pokemon.data.moves[i].move.name
      pokemon.moveset[i] = moveName
    }

    //le chiamate trasformano la stringa in oggetto completo con info mosse come PP o Potenza
    const promises = [];
    for (let i = 0; i < pokemon.moveset.length; i++) {
      const moveData = fetchFromApi("move", pokemon.moveset[i])
      promises.push(moveData)
    }
    const moves = await Promise.all(promises)

    if (target === "player") {
      setPlayerMoveSet(moves)
    } else {
      setEnemyMoveSet(moves)
    }

    return moves
  }

  //inizializza il moveset(andrà fatta una chiamata a /items)
  async function initializeItems() {
    const potion = await fetchFromApi("item", "potion")
    potion.quantity = 5;
    const hpPotion = new Items(potion, "You healed for", 20)
    setPlayerInv(hpPotion)
  }

  //------------fight system-------------

  function sendPlayerChoice(attacker, defencer, attackerMove, playerStats, enemyStats, enemyMoveSet) {
    //controlla chi è più veloce
    if (chechWhoFaster(playerStats, enemyStats)) {
      console.log("sei più veloce!")
      executePlayerTurn(attacker, defencer, playerStats, enemyStats, selectedMove)
      executeEnemyTurn(defencer, attacker, enemyMoveSet, playerStats, enemyStats)
      checkIfAlive(attacker, defencer)
    } else {
      console.log("sei più lento!")
      executeEnemyTurn(defencer, attacker, enemyMoveSet, playerStats, enemyStats)
      executePlayerTurn(attacker, defencer, playerStats, enemyStats, selectedMove)
      checkIfAlive(attacker, defencer)
    }
  }

  function setNewStage() {
    console.log("iniziamo il round", stage)
  }

  function executePlayerTurn(player, enemy, playerStats, enemyStats, selectedMove) {
    useMove(player, selectedMove, enemy, playerStats, enemyStats)
  }

  function executeEnemyTurn(enemy, player, enemyMoveSet, defenderStats, enemyStats) {
    useMove(enemy, enemyMoveSet[0], player, enemyStats, defenderStats)
  }
  function useMove(attacker, move, defender, attackerStats, defenderStats) {
    if (attacker.currentHp <= 0) return;
    if (move.power === null) {
      console.log("la mossa non fa danno!")
      return
    } else {
      console.log(attacker.data.name, "deals", trueDmgCalculator(attacker, attackerStats, defenderStats, move, defender), "to", defender.data.name, "using", move.name);
      updateHp(defender === player ? "player" : "enemy", "-", trueDmgCalculator(attacker, attackerStats, defenderStats, move, defender))
    }
  }

  function evaluateModifiers(attackerStats, defenderStats, move, attacker, defender) {
    let dmgMoltiplier = 1;


    //verifica se la mossa fallisce
    const random = generateRandomId(100);
    if (random >= move.accuracy) {
      console.log("la mossa fallisce!")
      return 0
    }

    //verifica se la mossa fa brutto colpo
    const random2 = generateRandomId(16);
    if (random2 <= 1) {
      console.log("Brutto colpo!")
      return dmgMoltiplier * 1,5
    }

    const moveType = move.type.name;
    const defenderTypes = defender.data.types.map(t => t.type.name);
    console.log("tipo mossa: ", moveType);
    defenderTypes.forEach(tipo => console.log("tipi difensore: ", tipo))

    const thisEfficacies = typesEfficacy.find(t => t.type === moveType);
    if (!thisEfficacies) return dmgMoltiplier;

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

  function checkIfAlive(player, enemy) {
    console.log("vita player: ", player.currentHp, "vita nemico: ", enemy.currentHp)
    if (player.currentHp <= 0) {
      console.log("fine gioco!", player.data.name, "è esausto")
      setIsGameOver(true);
      //riavvia il gioco
      handleProgression();
      setStage(1);
    } else if (enemy.currentHp <= 0) {
      console.log("Complimenti!", enemy.data.name, "è esausto")
      //lascia che lo stage prosegua inizializzando
      incrementStage(1)
    }
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

  }

  //----------progressione---------------

  //genera la progressione in rapporto agli stage 
  async function handleProgression() {
    await instancePokemon("player");
    await instancePokemon("enemy");
  }

  function generateNewFight(stage) {

  }

  function handleReward(stage) {

  }

  function renderRunRecap(player, enemy, stage) {

  }

  function incrementStage(n) {
    setStage(stage + n)
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
    const baseDamage =
      (((((2 * attacker.level) / 5 + 2) * move.power *
        attackerStats.attack / defenderStats.defense) / 50) + 2);

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

  //main(---tests----)
  //runGame()

  console.log("player: ", player, "enemy: ", enemy);

  return (
    <>
      <h1>Prova</h1>
      <div>{stage}</div>

      <img src={player.data?.sprites.front_default} alt="" />
      <img src={enemy.data?.sprites.front_default} alt="" />
      {playerMoveSet.map(move => (
        <p
          onClick={() => setSelectedMove(move)}
          key={move.id}
        >{move.name}</p>

      ))}
      <button onClick={() => sendPlayerChoice(player, enemy, selectedMove, playerStats, enemyStats, enemyMoveSet)}>Confirm</button>
      <p>Mossa attiva: {selectedMove?.name}</p>
    </>
  )
}

export default App
