/**
 * Splitenry v2 — Popup Quick Launcher
 *
 * Shows layout thumbnails. Clicking a layout opens the tiler tab
 * with that layout applied.
 */

const layoutGrid   = document.getElementById('layoutGrid');
const btnQuickOpen = document.getElementById('btnQuickOpen');
const statusText   = document.getElementById('statusText');
const toast        = document.getElementById('toast');
const toastMsg     = document.getElementById('toastMsg');

// ── Render layout grid ──────────────────────────────────────────

function renderLayouts() {
  layoutGrid.innerHTML = '';
  LAYOUTS.forEach(layout => {
    const card = document.createElement('div');
    card.className = 'layout-card';
    card.title = `${layout.name} (${layout.panels.length} panels)`;

    const badge = document.createElement('div');
    badge.className = 'panel-count';
    badge.textContent = layout.panels.length;

    const preview = document.createElement('div');
    preview.className = 'layout-preview';
    preview.innerHTML = createLayoutSVG(layout.panels);

    const name = document.createElement('div');
    name.className = 'layout-name';
    name.textContent = layout.name;

    card.appendChild(badge);
    card.appendChild(preview);
    card.appendChild(name);

    card.addEventListener('click', () => openTilerWithLayout(layout.id));
    layoutGrid.appendChild(card);
  });
}

function createLayoutSVG(panels) {
  const svgW = 48, svgH = 32, gap = 1.2, pad = 2;
  const iW = svgW - pad * 2, iH = svgH - pad * 2;
  let rects = '';
  panels.forEach(p => {
    const x = pad + p.x * iW + (p.x > 0 ? gap / 2 : 0);
    const y = pad + p.y * iH + (p.y > 0 ? gap / 2 : 0);
    const w = p.w * iW - (p.x > 0 ? gap / 2 : 0) - (p.x + p.w < 1 ? gap / 2 : 0);
    const h = p.h * iH - (p.y > 0 ? gap / 2 : 0) - (p.y + p.h < 1 ? gap / 2 : 0);
    rects += `<rect class="panel-rect" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w, 2).toFixed(1)}" height="${Math.max(h, 2).toFixed(1)}"/>`;
  });
  return `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

// ── Open tiler tab ──────────────────────────────────────────────

async function openTilerWithLayout(layoutId) {
  showToast('Opening...');
  try {
    await chrome.runtime.sendMessage({
      action: 'openTiler',
      layoutId: layoutId || null,
    });
    setTimeout(() => window.close(), 300);
  } catch (err) {
    console.error('Failed to open tiler:', err);
  }
}

// ── Quick open (no layout) ──────────────────────────────────────

btnQuickOpen.addEventListener('click', () => openTilerWithLayout(null));

// ── Status ──────────────────────────────────────────────────────

async function loadStatus() {
  try {
    const info = await chrome.runtime.sendMessage({ action: 'getWindowInfo' });
    if (info && info.success) {
      statusText.textContent = `${info.totalTabs} tabs • ${info.totalWindows} windows`;
    } else {
      statusText.textContent = 'Ready';
    }
  } catch {
    statusText.textContent = 'Ready';
  }
}

// ── Toast ────────────────────────────────────────────────────────

function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

// ── Init ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderLayouts();
  loadStatus();
});
