
import './App.css'
import { useState } from 'react';

function App() {
 
  //----------stati---------------
  const [ stage, setStage ] = useState(0)
  const [ player, setPlayer ] = useState({})
  const [ enemy, setEnemy ] = useState({})
  const [ isGameOver, setIsGameOver ] = useState(false)

  //----------costanti---------------
  const baseUrl = "https://pokeapi.co/api/v2/"
  //qui puoi decidere entro quale id spawnano i pokemon (puoi in futuro far decidere al player)
  const idLimit = 1000;

  //----------classi---------------

  //inizializza classe per istanziare i pokemon effettivamente in gioco
  class PokemonInstance {
    
  }

  //gestisce la logica dei calcoli relativi alle statistiche
  class Stats {
    
  }

  //gestisce la logica delle mosse(tipo, fallimento/critico, calcolo esito in danni)
  class Moves {

  }

  //gestisce la logica degli oggetti
  class Items{

  }

  //gestisce andamento del gioco
  class Progression{

  }

  //----------inizializzazioni---------------

  function runGame(){
    console.log("il gioco è iniziato");
    instancePokemon();
    handleProgression();
  }

  //inizializza player e nemico con this. e gli aggiunge proprietà items e moveset
  function instancePokemon(fetchedPokemon){
    console.log("hai chiamato l'inizializzazione dei pokemon (player e nemico)");
    initializeMoveset();
    initializeItems();
  }

 //fetcha qualcosa
  async function fetchFromApi(category, id){
    const requestedPromise = await fetch(`${baseUrl}${category}/${id}`)
    const requestedObj = await requestedPromise.json()
    return requestedObj
  }

  //inizializza il moveset(andrà fatta una chiamata a /moves)
  function initializeMoveset(poke){

  }

  //inizializza il moveset(andrà fatta una chiamata a /items)
  function initializeItems(){

  }

  //------------fight system-------------
  function handleFight(player, enemy){
    
  }

  function chechWhoFaster(player, enemy){
    
  }

  function useItem(item){

  }


  //----------progressione---------------

  //genera la progressione in rapporto agli stage 
  function handleProgression(){
    console.log("avvio progressione in base allo stage. STAGE: ", stage)
  }

  function generateNewFight(stage){

  }

  function handleReward(stage){

  }

  //----------utilities---------------
  // id casuale per randomizzare da 0 a un limite 
  function generateRandomId(max){
    const random = Math.round(Math.random() * max)
    return random
  }


  //main
  runGame()
 

  return (
    <>
      <h1>Prova</h1>
    </>
  )
}

export default App
