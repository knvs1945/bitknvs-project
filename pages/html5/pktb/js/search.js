import { CONFIG } from './config.js';
import { capitalize } from './utils.js';
import { searchPokemonByQuery, spriteUrl } from './pokeapi.js';

export function initSearch({ inputEl, clearBtn, suggestionsEl, onSelect }) {
  let debounceTimer = null;

  inputEl.addEventListener('input', () => {
    const rawValue = inputEl.value;
    clearBtn.hidden = rawValue.length === 0;

    clearTimeout(debounceTimer);
    const letterCount = (rawValue.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 3) {
      hideSuggestions();
      return;
    }
    debounceTimer = setTimeout(() => runSearch(rawValue.trim()), CONFIG.SEARCH_DEBOUNCE_MS);
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    clearBtn.hidden = true;
    hideSuggestions();
    inputEl.focus();
  });

  // Close suggestions on outside click (this is just a typeahead dropdown,
  // not the evaluation lightbox — normal click-outside-to-close is fine here).
  document.addEventListener('click', (e) => {
    if (e.target !== inputEl && !suggestionsEl.contains(e.target)) {
      hideSuggestions();
    }
  });

  async function runSearch(query) {
    try {
      const results = await searchPokemonByQuery(query, CONFIG.SEARCH_SUGGESTION_LIMIT);
      renderSuggestions(results);
    } catch (err) {
      console.error('Search failed', err);
      hideSuggestions();
    }
  }

  function renderSuggestions(results) {
    suggestionsEl.innerHTML = '';
    if (!results.length) {
      hideSuggestions();
      return;
    }

    results.forEach((p) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'suggestion-item';
      item.textContent = capitalize(p.name);
      item.addEventListener('click', () => {
        onSelect({ id: p.id, name: p.name, sprite: spriteUrl(p.id) });
        inputEl.value = '';
        clearBtn.hidden = true;
        hideSuggestions();
      });
      suggestionsEl.appendChild(item);
    });

    suggestionsEl.hidden = false;
  }

  function hideSuggestions() {
    suggestionsEl.hidden = true;
    suggestionsEl.innerHTML = '';
  }
}
