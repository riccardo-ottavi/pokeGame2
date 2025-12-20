import './App.css'
import { useEffect, useState } from 'react';

function App() {

  //----------stati---------------
  const [stage, setStage] = useState(0)
  const [player, setPlayer] = useState({})
  const [enemy, setEnemy] = useState({})
  const [isGameOver, setIsGameOver] = useState(false)

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
      const pokeId = generateRandomId(idLimit)
      const poke = await fetchFromApi("pokemon", pokeId);
      const instanciatedPlayer = new PokemonInstance(pokeId, 5, calculateHpByLevel(poke.stats[0].base_stat, 5), calculateHpByLevel(poke.stats[0].base_stat, 5), null, poke, 0);
      setPlayer(instanciatedPlayer)
      
    }else{
      const pokeId = generateRandomId(idLimit)
      const poke = await fetchFromApi("pokemon", pokeId);
      const instanciatedEnemy = new PokemonInstance(pokeId, 5, calculateHpByLevel(poke.stats[0].base_stat, 5), calculateHpByLevel(poke.stats[0].base_stat, 5), null, poke, 0);           
      setEnemy(instanciatedEnemy)
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

  function chechWhoFaster(player, enemy) {

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
  //fetchFromApi("pokemon",1).then(p => console.log(p))

  console.log("player: ", player, "enemy: " , enemy)

  return (
    <>
      <h1>Prova</h1>
    </>
  )
}

export default App
