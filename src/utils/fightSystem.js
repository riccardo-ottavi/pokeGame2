import { processTurnStatus } from "./status";
import { trueDmgCalculator } from "./stats";
import { formatMove, buildEffects, initializeMoveset } from "./moves";

export function sendPlayerChoice(player, enemy, move) {
  return useMove(player, enemy, move);
}


export function executePlayerTurn(attacker, defender, move, setters) {
  if (!move) return;
  if (!processTurnStatus(attacker, setters)) return;

  useMove(attacker, move, defender);
}

export function executeEnemyTurn(attacker, defender, setters) {
  if (!processTurnStatus(attacker, setters)) return null;

  const move = attacker.moveset?.[0];
  if (!move) return null;

  return useMove(attacker, defender, move, setters); // ritorna il danno
}

//funzione principale del fight system, riceve una mossa o oggetto e sceglie come procedere 
export function useMove(attacker, defender, move, setters) {
  if (!move || attacker.currentHp <= 0) return null;

  const damage = trueDmgCalculator(attacker, defender, move);

  // Se la mossa ha effetti sulle statistiche
  if (move.effects) {
    move.effects.forEach(effect => {
      if (effect.type === "statChange") {
        applyStatChange(defender, effect.stat, effect.amount, setters);
      }
    });
  }

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    damage
  };
}



//applica cambiamenti alle statistiche 
export function applyStatChange(target, stat, amount, setters) {
  const { setPlayer, setEnemy } = setters;
  const updateFn = target.isPlayer ? setPlayer : setEnemy;

  updateFn(prev => {
    const newStages = { ...prev.statModifiers };
    newStages[stat] = Math.max(-6, Math.min(6, newStages[stat] + amount));
    return { ...prev, statModifiers: newStages };
  });

  console.log(`${target.data.name} cambia stat ${stat} di ${amount} step`);
}

export function updateHp(target, operator, amount, setters) {
    const { setPlayer, setEnemy } = setters;
    const setter = target === "player" ? setPlayer : setEnemy;

    setter(prev => {
        const newHp = operator === "+"
            ? Math.min(prev.maxHp, prev.currentHp + amount)
            : Math.max(0, prev.currentHp - amount);

        console.log(`${prev.data.name} HP: ${prev.currentHp} → ${newHp}`);

        return { ...prev, currentHp: newHp };
    });
}

//se il player è più veloce ritorna true
export function checkWhoFaster(player, enemy) {
  if (!player?.stats || !enemy?.stats) {
    console.error("checkWhoFaster: stats mancanti", { player, enemy });
    return true;
  }

  return player.stats.speed >= enemy.stats.speed;
}

export function useItem(item, setters) {
    console.log("Hai usato l' oggetto: ", item.name);
    updateHp("player", "+", 20, setters);
}