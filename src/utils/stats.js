import { fetchFromApi, fetchJson, generateRandomId } from '../utils/api.js';
import { typesEfficacy, idLimit } from '../constants.js';

//calcola le stats
export function calcStats(statsData, level) {
    const stats = {};

    statsData.forEach(s => {
        if (s.stat.name === "hp") {
            stats.hp = Math.floor(((s.base_stat * 2 * level) / 100) + level + 10);
        } else {
            stats[s.stat.name] = Math.floor(((s.base_stat * 2 * level) / 100) + 5);
        }
    });

    stats.hp += level + 5;

    return stats;
}

//serve a gestire i danni quando le stats sono buffate
export function getStageMultiplier(stage) {
    if (stage >= 0) return (2 + stage) / 2;
    return 2 / (2 - stage);
}

export function evaluateModifiers(attackerStats, defenderStats, move, attacker, defender) {
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

export function trueDmgCalculator(attacker, attackerStats, defenderStats, move, defender) {

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