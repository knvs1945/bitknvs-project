// Wraps a button (or any clickable element) around an in-flight request:
// disables it, swaps its content for a spinner, then restores it once the
// promise settles — whether it succeeds, fails, or times out. The actual
// timeout is enforced upstream by fetchWithTimeout() in api.js / pokeapi.js;
// this module only owns the *visual* loading state, not the timing.

export async function withButtonLoading(button, taskPromise) {
  const originalContent = button.innerHTML;
  const originalWidth = button.offsetWidth;

  button.disabled = true;
  button.style.minWidth = `${originalWidth}px`;
  button.innerHTML = '<span class="spinner" aria-hidden="true"></span>';

  try {
    return await taskPromise;
  } finally {
    button.disabled = false;
    button.innerHTML = originalContent;
    button.style.minWidth = '';
  }
}
