import { CONFIG } from './config.js';
import { capitalize, fitTextToWidth } from './utils.js';
import { getRandomPokemon, getOneRandomPokemon, spriteUrl } from './pokeapi.js';

export function initRandomSuggestions({ gridEl, shuffleBtn, onPick }) {
  let currentPicks = [];
  let isFull = false;

  async function loadAll() {
    try {
      currentPicks = await getRandomPokemon(CONFIG.RANDOM_SUGGESTION_COUNT);
      render();
    } catch (err) {
      console.error('Failed to load random suggestions', err);
    }
  }

  function render() {
    gridEl.innerHTML = '';
    currentPicks.forEach((pokemon, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'suggestion-card';
      card.disabled = isFull;
      card.innerHTML = `
        <img src="${spriteUrl(pokemon.id)}" alt="">
        <span class="suggestion-name">${capitalize(pokemon.name)}</span>
      `;
      card.addEventListener('click', () => handlePick(pokemon, index));
      gridEl.appendChild(card);
      fitTextToWidth(card.querySelector('.suggestion-name'));
    });
  }

  function handlePick(pokemon, index) {
    onPick({ id: pokemon.id, name: pokemon.name, sprite: spriteUrl(pokemon.id) });
    replaceOne(index);
  }

  async function replaceOne(index) {
    try {
      const excludeIds = currentPicks.map((p) => p.id);
      currentPicks[index] = await getOneRandomPokemon(excludeIds);
      render();
    } catch (err) {
      console.error('Failed to refresh a suggestion card', err);
    }
  }

  // Called by app.js whenever the roster fills up or frees a slot — a
  // disabled card can't be clicked, so it also can't churn/replace itself
  // for no reason once there's nowhere left to add it.
  function setFull(full) {
    isFull = full;
    Array.from(gridEl.children).forEach((card) => {
      card.disabled = full;
    });
  }

  shuffleBtn.addEventListener('click', loadAll);
  loadAll();

  return { setFull };
}
