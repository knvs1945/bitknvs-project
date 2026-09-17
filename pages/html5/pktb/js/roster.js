import { capitalize, fitTextToWidth } from './utils.js';

export function initRoster({ gridEl, countEl, clearBtn, rateBtn, maxTeamSize, onRateTeam, onChange }) {
  let team = []; // { id, name, sprite }[]

  function render() {
    gridEl.innerHTML = '';
    team.forEach((pokemon) => {
      const slot = document.createElement('div');
      slot.className = 'roster-slot';
      slot.dataset.pokemonId = pokemon.id;
      slot.innerHTML = `
        <button class="roster-remove-btn" aria-label="Remove ${capitalize(pokemon.name)}">&times;</button>
        <img src="${pokemon.sprite}" alt="">
        <span class="roster-name">${capitalize(pokemon.name)}</span>
      `;
      slot.querySelector('.roster-remove-btn').addEventListener('click', () => removePokemon(pokemon.id));
      gridEl.appendChild(slot);
      fitTextToWidth(slot.querySelector('.roster-name'));
    });

    countEl.textContent = `${team.length} / ${maxTeamSize}`;
    rateBtn.disabled = team.length === 0;
    onChange?.(team.length, maxTeamSize);
  }

  function addPokemon(pokemon) {
    if (team.length >= maxTeamSize) return;
    if (team.some((p) => p.id === pokemon.id)) return; // no duplicates
    team.push(pokemon);
    render();
  }

  function removePokemon(id) {
    team = team.filter((p) => p.id !== id);
    render();
  }

  function clearTeam() {
    team = [];
    render();
  }

  clearBtn.addEventListener('click', clearTeam);
  rateBtn.addEventListener('click', () => onRateTeam(getTeam()));

  function getTeam() {
    return [...team];
  }

  render();

  return { addPokemon, removePokemon, clearTeam, getTeam };
}
