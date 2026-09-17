// Relies on the html2canvas UMD build loaded via <script> in webapp.html
// (see the CDN tag in <head>). This is a self-contained behavior: the
// button gets its own loading state independent of the fetch-based ones.

export function initSaveRating(button, targetEl) {
  if (!button || !targetEl) return;

  button.addEventListener('click', async () => {
    if (typeof window.html2canvas !== 'function') {
      alert('Screenshot library failed to load — check your connection and try again.');
      return;
    }

    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner" aria-hidden="true"></span>';

    try {
      const canvas = await window.html2canvas(targetEl, {
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `pktb-team-rating-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Screenshot failed', err);
      alert('Could not save the screenshot. Please try again.');
    } finally {
      button.disabled = false;
      button.innerHTML = originalContent;
    }
  });
}
