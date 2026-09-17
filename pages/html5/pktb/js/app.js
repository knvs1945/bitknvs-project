import { CONFIG } from './config.js';
import { withButtonLoading } from './loader.js';
import { checkHealth, evaluateTeam } from './api.js';
import { initSearch } from './search.js';
import { initRandomSuggestions } from './randomSuggestions.js';
import { initRoster } from './roster.js';
import { initLightbox } from './lightbox.js';
import { initSidebar } from './sidebar.js';
import { initAboutModal } from './aboutModal.js';
import { initSaveRating } from './screenshot.js';

async function loadFragment(url, mountSelector) {
  const mount = document.querySelector(mountSelector);
  if (!mount) return;
  try {
    const res = await fetch(url);
    mount.innerHTML = await res.text();
  } catch (err) {
    console.error(`Failed to load fragment: ${url}`, err);
  }
}

function showAgentOfflineMessage() {
  const rosterSection = document.querySelector('.roster-section');
  if (!rosterSection) return;
  rosterSection.innerHTML =
    '<p class="agent-offline-message">Oh no, the gym leader is not around to check your team!</p>';
}

async function init() {
  // Sidebar and footer are separate fragment files (html/sidebar.html,
  // html/footer.html) so every future page can share them without
  // duplicating markup — pull them in before wiring up anything that lives
  // inside them (the hamburger toggle needs #sidebar-overlay to exist).
  await Promise.all([
    loadFragment('html/sidebar.html', '#sidebar-include'),
    loadFragment('html/footer.html', '#footer-include'),
  ]);

  initSidebar({
    hamburgerBtn: document.getElementById('hamburger-btn'),
    overlayEl: document.getElementById('sidebar-overlay'),
  });

  initAboutModal({
    triggerLinkEl: document.getElementById('about-pktb-link'),
    modalEl: document.getElementById('about-lightbox'),
    closeBtn: document.getElementById('about-close-btn'),
    sidebarOverlayEl: document.getElementById('sidebar-overlay'),
  });

  const lightbox = initLightbox({
    lightboxEl: document.getElementById('lightbox'),
    tabButtons: Array.from(document.querySelectorAll('.tab-btn')),
    tabPanels: Array.from(document.querySelectorAll('.tab-panel')),
    closeBtn: document.getElementById('lightbox-close'),
    chartCanvasEl: document.getElementById('matchup-chart'),
    chartSubtabButtons: Array.from(document.querySelectorAll('.chart-subtab-btn')),
    lineupGridEl: document.getElementById('matchup-roster'),
    evalSubtabsEl: document.getElementById('eval-subtabs'),
    evalContentEl: document.getElementById('eval-content'),
    personalityHeadlineEl: document.getElementById('personality-headline'),
    personalityDetailEl: document.getElementById('personality-detail'),
  });

  initSaveRating(
    document.getElementById('save-rating-btn'),
    document.querySelector('.lightbox-panel')
  );

  // Health check gates whether team-building/rating is usable at all — if
  // the agent is down (e.g. out of credits), replace the roster section
  // with a friendly note instead of letting people hit a dead endpoint.
  let isAgentActive = false;
  try {
    const health = await checkHealth();
    isAgentActive = Boolean(health?.agent_is_active);
  } catch (err) {
    console.error('Health check failed', err);
    isAgentActive = false;
  }

  let addToRoster = () => {}; // no-op fallback when the agent is offline
  let randomSuggestions; // assigned below; referenced by roster's onChange, which can fire immediately

  if (isAgentActive) {
    const rateBtn = document.getElementById('rate-team-btn');

    const roster = initRoster({
      gridEl: document.getElementById('roster-grid'),
      countEl: document.getElementById('roster-count'),
      clearBtn: document.getElementById('clear-team-btn'),
      rateBtn,
      maxTeamSize: CONFIG.MAX_TEAM_SIZE,
      onChange: (count, max) => randomSuggestions?.setFull(count >= max),
      onRateTeam: async (team) => {
        try {
          const teamNames = team.map((p) => p.name.toLowerCase());
          const result = await withButtonLoading(rateBtn, evaluateTeam(teamNames));
          lightbox.open(team, result);
        } catch (err) {
          alert(`Couldn't rate your team — ${err.message}.`);
        }
      },
    });

    addToRoster = roster.addPokemon;
  } else {
    showAgentOfflineMessage();
  }

  initSearch({
    inputEl: document.getElementById('search-input'),
    clearBtn: document.getElementById('search-clear-btn'),
    suggestionsEl: document.getElementById('suggestions'),
    onSelect: (pokemon) => addToRoster(pokemon),
  });

  randomSuggestions = initRandomSuggestions({
    gridEl: document.getElementById('random-suggestions'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    onPick: (pokemon) => addToRoster(pokemon),
  });

  // If the agent came back offline, there's no roster to add into — lock
  // the suggestion cards too rather than leaving a dead-looking action.
  if (!isAgentActive) {
    randomSuggestions.setFull(true);
  }
}

document.addEventListener('DOMContentLoaded', init);
