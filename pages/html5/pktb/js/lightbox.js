import { capitalize, fitTextToWidth } from './utils.js';
import { withButtonLoading } from './loader.js';
import { fetchPokemonMatchupDetail, fetchTrainerPersonality } from './api.js';
import { renderTypeChart } from './charts.js';

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

// The persona endpoint returns prose, not a structured type field, so the
// MBTI code(s) it mentions have to be pulled out of the text itself —
// checking against the fixed list of 16 real codes rather than parsing
// free-form language.
function extractMbtiTypes(text) {
  if (!text) return [];
  const found = [];
  MBTI_TYPES.forEach((code) => {
    if (new RegExp(`\\b${code}\\b`, 'i').test(text) && !found.includes(code)) {
      found.push(code);
    }
  });
  return found;
}

export function initLightbox({
  lightboxEl,
  tabButtons,
  tabPanels,
  closeBtn,
  chartCanvasEl,
  chartSubtabButtons,
  lineupGridEl,
  evalSubtabsEl,
  evalContentEl,
  personalityHeadlineEl,
  personalityDetailEl,
}) {
  let currentTeam = [];
  let prosData = {};
  let consData = {};
  let activeChartTab = 'pros';
  const evalTabs = new Map(); // key -> { text }

  function open(team, evaluationResult) {
    currentTeam = team;
    prosData = evaluationResult?.pros ?? {};
    consData = evaluationResult?.cons ?? {};
    activeChartTab = 'pros';
    chartSubtabButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.chartTab === 'pros'));

    personalityHeadlineEl.innerHTML = '';
    personalityDetailEl.innerHTML = '';
    delete personalityDetailEl.dataset.loaded;

    // Make the panel visible FIRST — Chart.js measures the canvas's
    // container at creation time, and a display:none ancestor reads as
    // 0x0. It won't redraw later just because the container becomes
    // visible, so rendering the chart before this line drew nothing.
    lightboxEl.classList.add('is-open');

    renderLineup();
    renderChart();
    resetEvalTabs(evaluationResult?.evaluation ?? '');
    switchTab('matchups');
  }

  function close() {
    lightboxEl.classList.remove('is-open');
  }

  // Deliberately no backdrop-click listener here — the close button is the
  // only way out, per spec, so an accidental tap outside the panel doesn't
  // lose the evaluation the user just waited for.
  closeBtn.addEventListener('click', close);

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn));
  });

  function switchTab(tabName, btnEl) {
    tabButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tabName));
    tabPanels.forEach((p) => p.classList.toggle('is-active', p.id === `tab-${tabName}`));

    if (tabName === 'personality' && !personalityDetailEl.dataset.loaded) {
      const button = btnEl || tabButtons.find((b) => b.dataset.tab === 'personality');
      loadPersonality(button);
    }
  }

  // --- Pros / Cons chart subtabs ---
  chartSubtabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeChartTab = btn.dataset.chartTab;
      chartSubtabButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
      renderChart();
    });
  });

  function renderChart() {
    const dataObj = activeChartTab === 'cons' ? consData : prosData;
    renderTypeChart(chartCanvasEl, dataObj, activeChartTab);
  }

  // --- Team lineup (left column on desktop, first block on mobile) ---
  function renderLineup() {
    lineupGridEl.innerHTML = '';
    currentTeam.forEach((pokemon) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'matchup-lineup-item';
      item.dataset.pokemonId = pokemon.id;
      item.innerHTML = `
        <img src="${pokemon.sprite}" alt="">
        <span class="lineup-name">${capitalize(pokemon.name)}</span>
      `;
      item.addEventListener('click', () => handleLineupClick(pokemon, item));
      lineupGridEl.appendChild(item);
      fitTextToWidth(item.querySelector('.lineup-name'));
    });
  }

  async function handleLineupClick(pokemon, btnEl) {
    const key = `pokemon-${pokemon.id}`;
    if (evalTabs.has(key)) {
      switchEvalTab(key);
      return;
    }
    try {
      const detailText = await withButtonLoading(btnEl, fetchPokemonMatchupDetail(pokemon.name));
      evalTabs.set(key, { text: detailText });
      addEvalTabButton(key, pokemon);
      switchEvalTab(key);
    } catch (err) {
      alert(`Couldn't load ${capitalize(pokemon.name)}'s matchup — ${err.message}.`);
    }
  }

  // --- Evaluation subtabs: "Full team" plus one per clicked pokemon ---
  function resetEvalTabs(teamEvaluationText) {
    evalTabs.clear();
    evalTabs.set('team', { text: teamEvaluationText || 'No evaluation returned.' });

    Array.from(evalSubtabsEl.querySelectorAll('.eval-subtab-btn')).forEach((btn) => {
      if (btn.dataset.evalTab !== 'team') btn.remove();
    });

    switchEvalTab('team');
  }

  function addEvalTabButton(key, pokemon) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'eval-subtab-btn';
    btn.dataset.evalTab = key;
    btn.innerHTML = `
      <img class="eval-subtab-icon" src="${pokemon.sprite}" alt="${capitalize(pokemon.name)}">
      <span class="eval-subtab-label">${capitalize(pokemon.name)}</span>
    `;
    btn.addEventListener('click', () => switchEvalTab(key));
    evalSubtabsEl.appendChild(btn);
  }

  function switchEvalTab(key) {
    Array.from(evalSubtabsEl.querySelectorAll('.eval-subtab-btn')).forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.evalTab === key);
    });
    const tab = evalTabs.get(key);
    evalContentEl.innerHTML = `<p>${tab?.text ?? ''}</p>`;
  }

  // The "Full team" button is static markup (always present) — wire it once.
  evalSubtabsEl.querySelector('[data-eval-tab="team"]')?.addEventListener('click', () => switchEvalTab('team'));

  // --- Personality tab ---
  async function loadPersonality(button) {
    try {
      const result = await withButtonLoading(button, fetchTrainerPersonality());
      const message = result?.message ?? 'No personality result returned.';
      const types = extractMbtiTypes(message);

      personalityHeadlineEl.innerHTML = types.length
        ? `<p class="personality-headline-text">You're an ${types.join(' / ')} trainer!</p>`
        : '<p class="personality-headline-text">Your trainer personality is ready below.</p>';

      personalityDetailEl.innerHTML = `<p>${message}</p>`;
      personalityDetailEl.dataset.loaded = 'true';
    } catch (err) {
      personalityDetailEl.innerHTML = `<p class="error-text">Couldn't load your trainer type — ${err.message}.</p>`;
    }
  }

  return { open, close };
}
