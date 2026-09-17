export function initAboutModal({ triggerLinkEl, modalEl, closeBtn, sidebarOverlayEl }) {
  if (!triggerLinkEl || !modalEl) return;

  function open(event) {
    event.preventDefault();
    if (sidebarOverlayEl) sidebarOverlayEl.hidden = true;
    modalEl.classList.add('is-open');
  }

  function close() {
    modalEl.classList.remove('is-open');
  }

  triggerLinkEl.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
}
