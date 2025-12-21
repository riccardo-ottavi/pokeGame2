import './App.css'
import { useEffect, useState } from 'react';

function App() {

  //----------stati---------------
  const [stage, setStage] = useState(0)
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

  //gestisce andamento del gioco
  class Encounter {
    constructor(player, enemy, playerMoveSet, playerStats, enemyMoveSet, enemyStats, stage, reward){
      this.player = player;
      this.enemy = enemy;
      this.playerMoveSet = playerMoveSet;
      this.playerStats = playerStats;
      this.enemyMoveSet = enemyMoveSet;
      this.enemyStats = enemyStats;
      this.stage = stage;
      this.reward = reward;
    }
  }

  //test
  useEffect(() => {
    instancePokemon("player");
    instancePokemon("enemy");
  }, [])

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
      const enemyStats = new Stats(poke.stats, 5);

      const instanciatedEnemy = new PokemonInstance(pokeId, 5, enemyStats.hp, enemyStats.hp, null, poke, 0);
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

  function executePlayerTurn(player, enemy, playerStats, enemyStats, selectedMove) {
    console.log(player.data.name, "deals", trueDmgCalculator(player, playerStats, enemyStats, selectedMove), "to", enemy.data.name, "using", selectedMove.name);
    updateHp(enemy, "-", trueDmgCalculator(player, playerStats, enemyStats, selectedMove))
  }

  function executeEnemyTurn(enemy, player, enemyMoveSet, playerStats, enemyStats) {
    console.log(enemy?.data?.name, "deals", trueDmgCalculator(enemy, playerStats, enemyStats, enemyMoveSet[0]), "to", player.data.name, "using", enemyMoveSet[0].name);
    updateHp(player, "-", trueDmgCalculator(enemy, playerStats, enemyStats, enemyMoveSet[0]))
  }

  function handleFight(player, enemy) {

  }


  function enemyIa(enemy, player, enemyMoveSet,) {

  }


  function checkIfAlive(player, enemy) {
    console.log("vita player: ", player.currentHp, "vita nemico: ", enemy.currentHp)
    if (player.currentHp <= 0) {
      console.log("fine gioco!", player.data.name, "è esausto")
      setIsGameOver(true);
    }else if(enemy.currentHp <= 0){
      console.log("fine gioco!", enemy.data.name, "è esausto")
      incrementStage(1)
    }
  }

  function updateHp(pokemon, operator, ammount) {
    if (operator === "+") {
      pokemon.currentHp = pokemon.currentHp + ammount
    } else {
      pokemon.currentHp = pokemon.currentHp - ammount
    }
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
  function handleProgression() {
  }

  function generateNewFight(stage) {

  }

  function handleReward(stage) {

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

  function trueDmgCalculator(attacker, attackerStats, defenderStats, move) {
    const damage = ((((2 * attacker.level) / 5 + 2) * move.power * attackerStats.attack / defenderStats.defense) / 50) + 2
    return Math.floor(damage)
  }


  //main(---tests----)
  //runGame()

  console.log("player: ", player, "enemy: ", enemy);
  console.log("moveset del player", playerMoveSet);
  console.log("moveset del nemico", enemyMoveSet);
  console.log("inventario", playerInv);
  handleFight(player, enemy);


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
