export function processTurnStatus(pokemon) {
    let canAct = true; // assume che il Pokémon possa agire

    // --- 1️⃣ Volatile Status ---
    if (pokemon.volatileStatus?.length) {
        // itera tutti i volatili
        for (let i = pokemon.volatileStatus.length - 1; i >= 0; i--) {
            const volatile = pokemon.volatileStatus[i];

            switch (volatile.type) {
                case "confusion":
                    if (volatile.turns > 0) {
                        // decrementa i turni
                        if (pokemon === player) {
                            setPlayer(prev => ({
                                ...prev,
                                volatileStatus: prev.volatileStatus.map((s, i) =>
                                    i === i ? { ...s, turns: s.turns - 1 } : s
                                )
                            }));
                        } else {
                            setEnemy(prev => ({
                                ...prev,
                                volatileStatus: prev.volatileStatus.map((s, i) =>
                                    i === i ? { ...s, turns: s.turns - 1 } : s
                                )
                            }));
                        }
                        if (generateRandomId(100) < 50) {
                            // si danneggia da solo
                            const selfDamage = Math.floor(pokemon.maxHp / 8);
                            console.log(`${pokemon.data.name} è confuso e si danneggia da solo!`);
                            updateHp(pokemon === player ? "player" : "enemy", "-", selfDamage);
                            canAct = false;
                        } else {
                            console.log(`${pokemon.data.name} è confuso ma agisce normalmente`);
                        }
                    } else {
                        // rimuove la confusione
                        removeVolatileStatus(pokemon, "confusion");
                        console.log(`${pokemon.data.name} non è più confuso!`);
                    }
                    break;

                case "flinch":
                    console.log(`${pokemon.data.name} subisce Flinch e salta il turno!`);
                    removeVolatileStatus(pokemon, "flinch");
                    canAct = false;
                    break;

                // qui puoi aggiungere altri volatili tipo "taunt", "disable" ecc.
            }
        }
    }

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
                    clearStatus(pokemon);
                    console.log(`${pokemon.data.name} si sveglia!`);
                }
                break;

            case "freeze":
                if (generateRandomId(100) <= 20) {
                    clearStatus(pokemon);
                    console.log(`${pokemon.data.name} si è scongelato!`);
                } else {
                    console.log(`${pokemon.data.name} è congelato e salta il turno!`);
                    canAct = false;
                }
                break;

            case "burn":
            case "poison":
                // danni da status applicati all'inizio del turno
                const dmg = Math.floor(pokemon.maxHp / 8);
                console.log(`${pokemon.data.name} subisce danno da ${pokemon.status.type}: ${dmg}`);
                updateHp(pokemon === player ? "player" : "enemy", "-", dmg);
                break;
        }
    }

    // --- 3️⃣ Stat modifiers da burn ---
    if (pokemon.status?.type === "burn") {
        // -1 attack
        if (pokemon === player) {
            setPlayer(prev => ({
                ...prev,
                statModifiers: {
                    ...prev.statModifiers,
                    attack: Math.max(-6, prev.statModifiers.attack - 1)
                }
            }));
        } else {
            setEnemy(prev => ({
                ...prev,
                statModifiers: {
                    ...prev.statModifiers,
                    attack: Math.max(-6, prev.statModifiers.attack - 1)
                }
            }));
        }
    }

    return canAct;
}


export function handleVolatileStatus(pokemon) {
    // --- CONFUSIONE ---
    const confusionIndex = pokemon.volatileStatus.findIndex(s => s.type === "confusion");
    if (confusionIndex !== -1) {
        const confusion = pokemon.volatileStatus[confusionIndex];

        if (confusion.turns > 0) {
            // decrementa i turni
            const newTurns = confusion.turns - 1;
            if (pokemon === player) {
                setPlayer(prev => ({
                    ...prev,
                    volatileStatus: prev.volatileStatus.map((s, i) =>
                        i === confusionIndex ? { ...s, turns: newTurns } : s
                    )
                }));
            } else {
                setEnemy(prev => ({
                    ...prev,
                    volatileStatus: prev.volatileStatus.map((s, i) =>
                        i === confusionIndex ? { ...s, turns: newTurns } : s
                    )
                }));
            }

            // 50% di chance di colpirsi da solo
            if (generateRandomId(100) < 50) {
                const selfDamage = Math.floor(pokemon.maxHp / 8);
                console.log(`${pokemon.data.name} è confuso e si danneggia da solo!`);
                updateHp(pokemon === player ? "player" : "enemy", "-", selfDamage);
                return false; // turno saltato
            }

            console.log(`${pokemon.data.name} è confuso ma agisce normalmente!`);
            return true; // il Pokémon può usare la mossa
        } else {
            // rimuove la confusione quando i turni finiscono
            if (pokemon === player) {
                setPlayer(prev => ({
                    ...prev,
                    volatileStatus: prev.volatileStatus.filter((_, i) => i !== confusionIndex)
                }));
            } else {
                setEnemy(prev => ({
                    ...prev,
                    volatileStatus: prev.volatileStatus.filter((_, i) => i !== confusionIndex)
                }));
            }
            console.log(`${pokemon.data.name} non è più confuso!`);
            return true;
        }
    }

    // --- FLINCH ---
    const flinchIndex = pokemon.volatileStatus.findIndex(s => s.type === "flinch");
    if (flinchIndex !== -1) {
        console.log(`${pokemon.data.name} subisce Flinch e salta il turno!`);
        // rimuove flinch subito dopo
        if (pokemon === player) {
            setPlayer(prev => ({
                ...prev,
                volatileStatus: prev.volatileStatus.filter((_, i) => i !== flinchIndex)
            }));
        } else {
            setEnemy(prev => ({
                ...prev,
                volatileStatus: prev.volatileStatus.filter((_, i) => i !== flinchIndex)
            }));
        }
        return false; // turno saltato
    }

    return true; // nessuno stato volatile blocca il turno
}

//verifica se lo status entra e capisce a chi assegnarlo
export function applyStatus(target, newStatus, chance) {
    if (target.status !== null) return target;
    if (chance >= generateRandomId(100)) {
        if (target === player) {
            setPlayer(prev => ({
                ...prev,
                status: newStatus
            }));

        } else if (target === enemy) {
            setEnemy(prev => ({
                ...prev,
                status: newStatus
            }));
        }
    }
}

export function applyVolatileEffect(pokemon, volatileStatus) {
    const alreadyPresent = pokemon.volatileStatus
        ?.some(s => s.type === volatileStatus.type);

    if (alreadyPresent) return pokemon;

    return {
        ...pokemon,
        volatileStatus: [
            ...(pokemon.volatileStatus || []),
            volatileStatus
        ]
    };
}

export function removeVolatileStatus(pokemon, type) {
    if (pokemon === player) setPlayer(prev => ({
        ...prev,
        volatileStatus: prev.volatileStatus.filter(v => v.type !== type)
    }));
    else setEnemy(prev => ({
        ...prev,
        volatileStatus: prev.volatileStatus.filter(v => v.type !== type)
    }));
}


