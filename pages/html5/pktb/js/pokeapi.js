import { CONFIG } from './config.js';

async function fetchWithTimeout(url, timeoutMs = CONFIG.RESPONSE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`PokeAPI responded with ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function idFromUrl(url) {
  const match = url.match(/\/pokemon\/(\d+)\//);
  return match ? Number(match[1]) : null;
}

export function spriteUrl(id) {
  return `${CONFIG.SPRITE_BASE_URL}/${id}.png`;
}

// One-time fetch of every Pokemon name + id, cached in memory for the life
// of the page. Cheap enough (~1300 entries, no images) to do up front and
// then filter client-side for instant-feeling search suggestions.
let nameListCache = null;

export async function getAllPokemonNames() {
  if (nameListCache) return nameListCache;
  const data = await fetchWithTimeout(`${CONFIG.POKEAPI_BASE_URL}/pokemon?limit=2000`, 20000);
  nameListCache = data.results
    .map((p) => ({ name: p.name, id: idFromUrl(p.url) }))
    .filter((p) => p.id !== null);
  return nameListCache;
}

export async function searchPokemonByQuery(query, limit = CONFIG.SEARCH_SUGGESTION_LIMIT) {
  const all = await getAllPokemonNames();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return all.filter((p) => p.name.includes(q)).slice(0, limit);
}

export async function getRandomPokemon(count = CONFIG.RANDOM_SUGGESTION_COUNT) {
  const all = await getAllPokemonNames();
  const picks = new Set();
  while (picks.size < count && picks.size < all.length) {
    picks.add(all[Math.floor(Math.random() * all.length)]);
  }
  return Array.from(picks);
}

// Picks one fresh, not-already-picked entry — used to replace a single
// suggestion card after it's been added to the roster.
export async function getOneRandomPokemon(excludeIds = []) {
  const all = await getAllPokemonNames();
  const pool = all.filter((p) => !excludeIds.includes(p.id));
  const source = pool.length ? pool : all;
  return source[Math.floor(Math.random() * source.length)];
}
