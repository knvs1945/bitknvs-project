export function initSidebar({ hamburgerBtn, overlayEl }) {
  if (!hamburgerBtn || !overlayEl) return;

  const closeBtn = overlayEl.querySelector('#sidebar-close-btn');

  function open() {
    overlayEl.hidden = false;
  }

  function close() {
    overlayEl.hidden = true;
  }

  hamburgerBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);

  // The sidebar isn't the evaluation lightbox — normal nav-drawer behavior
  // (close on backdrop click or Escape) is fine here.
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlayEl.hidden) close();
  });
}
