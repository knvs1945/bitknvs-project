// Relies on the Chart.js UMD build loaded via <script> in webapp.html.
// The /evaluate endpoint's pros/cons shape isn't pinned down yet (the only
// samples seen so far are empty objects), so this assumes a simple
// { typeName: numberOrString } shape scored 1–10, and coerces non-numeric
// values to a presence count of 1 — revisit once real, populated responses
// are in hand.

let activeChart = null;

function toNumeric(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 1 : parsed;
  }
  return value ? 1 : 0;
}

const MODE_STYLES = {
  pros: { label: 'Strong Against', color: '#2f9e44' },
  cons: { label: 'Weak Against', color: '#e3350d' },
};

// Renders a single vertical bar chart for whichever subtab is active
// (mode: 'pros' | 'cons'), reusing one canvas/instance rather than keeping
// two charts alive at once.
export function renderTypeChart(canvasEl, dataObj = {}, mode = 'pros') {
  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }

  const labels = Object.keys(dataObj);
  if (!labels.length || typeof window.Chart !== 'function') {
    return false; // nothing to plot, or the library failed to load
  }

  const style = MODE_STYLES[mode] ?? MODE_STYLES.pros;

  activeChart = new window.Chart(canvasEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: style.label,
          data: labels.map((label) => toNumeric(dataObj[label])),
          backgroundColor: style.color,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2 },
        },
      },
    },
  });

  return true;
}
