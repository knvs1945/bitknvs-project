// Shared constants used across every component. Keep anything here that more
// than one module needs to agree on, so there's a single source of truth.

export const CONFIG = {
  // --- Your LangChain server ---
  LANGCHAIN_SERVER_URL: 'https://api.hawkaiproject.com/pktb',
  // LANGCHAIN_SERVER_URL: 'http://10.0.0.108:8084', // local dev fallback
  ENDPOINTS: {
    // GET on the base URL itself is the health check.
    EVALUATE_TEAM: '/evaluate',   // POST { team: [lowercase names] } -> { pros, cons, evaluation, success }
    POKEMON_DETAIL: '/dex',       // POST { target: lowercase name } -> plain string
    PERSONALITY: '/persona',      // POST {} -> { message, success } (uses server's last evaluated team)
  },

  // How long we wait for any server response (LangChain or PokeAPI) before
  // treating it as timed out and re-enabling the UI.
  RESPONSE_TIMEOUT_MS: 15000,

  // --- Public PokeAPI ---
  POKEAPI_BASE_URL: 'https://pokeapi.co/api/v2',
  SPRITE_BASE_URL: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon',

  // --- App behavior ---
  MAX_TEAM_SIZE: 6,
  RANDOM_SUGGESTION_COUNT: 10,
  SEARCH_DEBOUNCE_MS: 250,
  SEARCH_SUGGESTION_LIMIT: 8,
};
