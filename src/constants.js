export const typesEfficacy = [
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

  export const idLimit = 1000;

   export const baseUrl = "https://pokeapi.co/api/v2/"
  //qui puoi decidere entro quale id spawnano i pokemon (puoi in futuro far decidere al player)