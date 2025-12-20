
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
    console.log("hai inizializzato i moveset dei pokemon (player e nemico)");
  }

  //inizializza il moveset(andrà fatta una chiamata a /items)
  function initializeItems(){
    console.log("hai inizializzato gli item dei pokemon (player e nemico)");
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

  //runGame();
  fetchFromApi("item",1)
  .then(poke => console.log(poke))

  return (
    <>
      <h1>Prova</h1>
    </>
  )
}

export default App
