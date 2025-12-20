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
    constructor(baseStat, level){
      this.baseStat = baseStat;
      this.level = level;
    }

    get hp(){
      return this.calcHp();
    }

    get speed(){
      return this.calcSpeed();
    }

    calcHp(){
      return Math.floor((2 * this.baseStat[0].base_stat * this.level) / 100) + this.level + 10;
    }

    calcSpeed(){
      return Math.floor((2 * this.baseStat[5].base_stat * this.level) / 100 + 5);
    }

  }

  //gestisce la logica delle mosse(tipo, fallimento/critico, calcolo esito in danni)
  class Moves {

  }

  //gestisce la logica degli oggetti
  class Items {

  }

  //gestisce andamento del gioco
  class Progression {

  }

  //test
  useEffect(() => {
    instancePokemon("player");
    instancePokemon("enemy");
  },[])

  //----------inizializzazioni---------------

  function runGame() {
   
  }

  //inizializza player e nemico con this. e gli aggiunge proprietà items e moveset
  async function instancePokemon(target) {
    //capisci se stai impostando player o enemy e assegna pokemon fetchato allo stato 
    if(target === "player"){
      //istanzia un pokemon a caso
      const pokeId = generateRandomId(idLimit)
      const poke = await fetchFromApi("pokemon", pokeId);

      //inizializza le statistiche in base al livello (inizialmente 5)
      const playerStats = new Stats(poke.stats, 5);
      
      const instanciatedPlayer = new PokemonInstance(pokeId, 5, playerStats.hp, playerStats.hp, null, poke, 0);
      setPlayer(instanciatedPlayer)
      setPlayerStats(playerStats)
      
      
      
    }else{
      //istanzia un pokemon a caso
      const pokeId = generateRandomId(idLimit)
      const poke = await fetchFromApi("pokemon", pokeId);

      //inizializza le statistiche in base al livello (inizialmente 5)
      const enemyStats = new Stats(poke.stats, 5);

      const instanciatedEnemy = new PokemonInstance(pokeId, 5, playerStats.hp, playerStats.hp, null, poke, 0);           
      setEnemy(instanciatedEnemy)
      setEnemyStats(enemyStats)
    }
  }

  

  //fetcha qualcosa
  async function fetchFromApi(category, id) {
    const requestedPromise = await fetchJson(`${baseUrl}${category}/${id}`)
    return requestedPromise
  }

  //inizializza il moveset(andrà fatta una chiamata a /moves)
  function initializeMoveset(poke) {
    
    
  }

  //inizializza il moveset(andrà fatta una chiamata a /items)
  function initializeItems() {

  }

  //------------fight system-------------
  function handleFight(player, enemy) {

  }

  function chechWhoFaster(playerStats, enemyStats) {
    console.log("velocità player", playerStats.speed, "velocità enemy", enemyStats.speed)
    if(playerStats.speed > enemyStats.speed){
      console.log("sei più veloce!")
    }else{
      console.log("sei più lento!")
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

  //----------utilities---------------
  // id casuale per randomizzare da 0 a un limite 
  function generateRandomId(max) {
    const random = Math.round(Math.random() * max)
    return random
  }

  //parsa le response in obj JSON
  async function fetchJson(url) {
    const response = await fetch(url);
    const obj = await response.json();
    return obj
  }

  function calculateHpByLevel(baseHp, level){
    return Math.floor((2 * baseHp * level) / 100) + level + 10;
  }


  //main(---tests----)
  //runGame()

  console.log("player: ", player, "enemy: " , enemy)
  chechWhoFaster(playerStats, enemyStats);

  return (
    <>
      <h1>Prova</h1>
    </>
  )
}

export default App
