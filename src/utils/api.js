import { baseUrl } from '../constants.js';

//fetcha qualcosa
export async function fetchFromApi(category, id) {
    const requestedPromise = await fetchJson(`${baseUrl}${category}/${id}`)
    return requestedPromise
}

//parsa le response in obj JSON
export async function fetchJson(url) {
    const response = await fetch(url);
    const obj = await response.json();
    return obj
}

// id casuale per randomizzare da 0 a un limite 
export function generateRandomId(max) {
    const random = Math.round(Math.random() * max);
    return random
}
