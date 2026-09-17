import { CONFIG } from './config.js';

// Generic fetch wrapper that aborts and rejects after RESPONSE_TIMEOUT_MS,
// so any caller (and withButtonLoading, which just awaits the promise) knows
// within a bounded time whether the request succeeded, failed, or timed out.
async function fetchWithTimeout(url, options = {}, timeoutMs = CONFIG.RESPONSE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function post(path, body) {
  return fetchWithTimeout(`${CONFIG.LANGCHAIN_SERVER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// GET on the base URL is the health check — returns
// { agent_is_active, agent_response, agent_status, message, status }.
export function checkHealth() {
  return fetchWithTimeout(CONFIG.LANGCHAIN_SERVER_URL);
}

// teamNames: array of lowercase pokemon name strings (exactly what the
// server expects) — the caller is responsible for lowercasing before this.
// Response: { pros: {...}, cons: {...}, evaluation: "...", success: true }
export function evaluateTeam(teamNames) {
  return post(CONFIG.ENDPOINTS.EVALUATE_TEAM, { team: teamNames });
}

// The server keeps no team context of its own for /dex — it just needs the
// target's lowercase name. Response is a bare string, not an object; some
// responses have been observed with stray wrapping quote characters, so we
// strip those defensively rather than assume a clean value every time.
export async function fetchPokemonMatchupDetail(pokemonName) {
  const result = await post(CONFIG.ENDPOINTS.POKEMON_DETAIL, { target: pokemonName.toLowerCase() });
  return typeof result === 'string' ? result.replace(/^"+|"+$/g, '') : result;
}

// No payload needed — the server bases this on the last team sent to
// /evaluate. Response: { message: "...", success: true }
export function fetchTrainerPersonality() {
  return post(CONFIG.ENDPOINTS.PERSONALITY, {});
}
