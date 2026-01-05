import { generateRandomId } from "./api";

/**
 * Gestisce tutti gli effetti di status e volatili all'inizio del turno.
 * Restituisce true se il Pokémon può agire, false se salta il turno.
 */
export function processTurnStatus(pokemon, setters) {
   
  let canAct = true;

  // --- 1️⃣ Volatile Status ---
  pokemon.volatileStatus?.forEach((volatile, idx) => {
    switch (volatile.type) {
      case "confusion":
        if (volatile.turns > 0) {
          const newTurns = volatile.turns - 1;
          const updateFn = pokemon.isPlayer ? setPlayer : setEnemy;

          updateFn(prev => ({
            ...prev,
            volatileStatus: prev.volatileStatus.map((s, i) => i === idx ? { ...s, turns: newTurns } : s)
          }));

          // 50% chance di colpirsi da solo
          if (generateRandomId(100) < 50) {
            const selfDamage = Math.floor(pokemon.maxHp / 8);
            console.log(`${pokemon.data.name} è confuso e si danneggia da solo!`);
            updateHp(pokemon, "-", selfDamage);
            canAct = false;
          }
        } else {
          removeVolatileStatus(pokemon, "confusion", setters);
        }
        break;

      case "flinch":
        console.log(`${pokemon.data.name} salta il turno per Flinch!`);
        removeVolatileStatus(pokemon, "flinch", setters);
        canAct = false;
        break;

      // Aggiungere altri volatili qui
    }
  });

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
          clearStatus(pokemon, setters);
          console.log(`${pokemon.data.name} si sveglia!`);
        }
        break;

      case "freeze":
        if (generateRandomId(100) <= 20) {
          clearStatus(pokemon, setters);
          console.log(`${pokemon.data.name} si è scongelato!`);
        } else {
          console.log(`${pokemon.data.name} è congelato e salta il turno!`);
          canAct = false;
        }
        break;

      case "burn":
      case "poison":
        const dmg = Math.floor(pokemon.maxHp / 8);
        console.log(`${pokemon.data.name} subisce danno da ${pokemon.status.type}: ${dmg}`);
        updateHp(pokemon, "-", dmg);
        break;
    }
  }

  // --- 3️⃣ Stat modifiers da burn ---
  if (pokemon.status?.type === "burn") {
    const updateFn = pokemon.isPlayer ? setPlayer : setEnemy;
    updateFn(prev => ({
      ...prev,
      statModifiers: {
        ...prev.statModifiers,
        attack: Math.max(-6, prev.statModifiers.attack - 1)
      }
    }));
  }

  return canAct;
}

/**
 * Rimuove un volatile dallo stato del Pokémon
 */
export function removeVolatileStatus(pokemon, type, setters) {
  const { setPlayer, setEnemy } = setters;
  const updateFn = pokemon.isPlayer ? setPlayer : setEnemy;

  updateFn(prev => ({
    ...prev,
    volatileStatus: prev.volatileStatus.filter(v => v.type !== type)
  }));
}

/**
 * Applica uno status persistente a un Pokémon (paralysis, sleep, burn, ecc.)
 */
export function applyStatus(target, newStatus, chance, setters) {
  if (target.status !== null) return;

  if (chance >= generateRandomId(100)) {
    const updateFn = target.isPlayer ? setters.setPlayer : setters.setEnemy;
    updateFn(prev => ({ ...prev, status: newStatus }));
  }
}

/**
 * Applica uno status volatile (confusion, flinch, ecc.) a un Pokémon
 */
export function applyVolatileEffect(pokemon, volatileStatus, setters) {
  const alreadyPresent = pokemon.volatileStatus?.some(s => s.type === volatileStatus.type);
  if (alreadyPresent) return;

  const updateFn = pokemon.isPlayer ? setters.setPlayer : setters.setEnemy;
  updateFn(prev => ({
    ...prev,
    volatileStatus: [...(prev.volatileStatus || []), volatileStatus]
  }));
}

/**
 * Rimuove uno status persistente
 */
export function clearStatus(pokemon, setters) {
  const updateFn = pokemon.isPlayer ? setters.setPlayer : setters.setEnemy;
  updateFn(prev => ({ ...prev, status: null }));
}

/**
 * Controlla tutti i volatili di un Pokémon e aggiorna i setter.
 * Restituisce true se il Pokémon può agire, false se salta il turno.
 */
export function handleVolatileStatus(pokemon, setters) {
  const { setPlayer, setEnemy, updateHp, removeVolatileStatus } = setters;
  let canAct = true;

  // --- CONFUSIONE ---
  const confusionIndex = pokemon.volatileStatus?.findIndex(s => s.type === "confusion");
  if (confusionIndex !== -1) {
    const confusion = pokemon.volatileStatus[confusionIndex];

    if (confusion.turns > 0) {
      const newTurns = confusion.turns - 1;
      const updateFn = pokemon.isPlayer ? setPlayer : setEnemy;

      updateFn(prev => ({
        ...prev,
        volatileStatus: prev.volatileStatus.map((s, i) => i === confusionIndex ? { ...s, turns: newTurns } : s)
      }));

      if (generateRandomId(100) < 50) {
        const selfDamage = Math.floor(pokemon.maxHp / 8);
        console.log(`${pokemon.data.name} è confuso e si danneggia da solo!`);
        updateHp(pokemon, "-", selfDamage);
        canAct = false; // turno saltato
      } else {
        console.log(`${pokemon.data.name} è confuso ma agisce normalmente!`);
      }
    } else {
      removeVolatileStatus(pokemon, "confusion", setters);
      console.log(`${pokemon.data.name} non è più confuso!`);
    }
  }

  // --- FLINCH ---
  const flinchIndex = pokemon.volatileStatus?.findIndex(s => s.type === "flinch");
  if (flinchIndex !== -1) {
    console.log(`${pokemon.data.name} subisce Flinch e salta il turno!`);
    removeVolatileStatus(pokemon, "flinch", setters);
    canAct = false;
  }

  return canAct;
}