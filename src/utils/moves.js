import { fetchJson } from "./api";

export function formatMove(move) {
    return {
        id: move.id,
        name: move.name,
        power: move.power,
        accuracy: move.accuracy,
        category: move.damage_class.name,
        type: move.type.name,

        effects: buildEffects(move)
    };
}

//dimmi che tipo di effetto produce e con quali parametri 
export function buildEffects(move) {
    const effects = [];

    // 1️⃣ Status / Volatile status
    if (move.meta?.ailment && move.meta.ailment.name !== "none") {
        const isVolatile = move.meta.ailment.name === "confusion";
        effects.push({
            kind: isVolatile ? "volatile-status" : "status",
            type: move.meta.ailment.name,
            chance: move.meta.ailment_chance || 100,
            target: move.target.name
        });
    }

    // 2️⃣ Modificatori di stat
    if (move.stat_changes?.length > 0) {
        move.stat_changes.forEach(sc => {
            effects.push({
                kind: "stat-change",
                stat: sc.stat.name,
                amount: sc.change,
                target: move.target.name
            });
        });
    }

    return effects;
}

//inizializza il moveset 
export async function initializeMoveset(pokemon, movesNumber) {
    const moveset = [];

    while (moveset.length < movesNumber) {
        const randomIndex = Math.floor(Math.random() * pokemon.data.moves.length);
        const moveUrl = pokemon.data.moves[randomIndex].move.url;

        if (!moveset.find(m => m.url === moveUrl)) {
            const moveData = await fetchJson(moveUrl);
            moveset.push(formatMove(moveData));
        }
    }

    return moveset;
}