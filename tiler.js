/**
 * Splitenry v2 — Tiler Engine
 *
 * Manages panel creation, iframe loading, draggable dividers,
 * and layout presets within a single browser tab.
 */

(function () {
  'use strict';

  // ── DOM refs ────────────────────────────────────────────────────

  const tilerContainer   = document.getElementById('tilerContainer');
  const layoutSelectorBtn = document.getElementById('layoutSelectorBtn');
  const layoutDropdown   = document.getElementById('layoutDropdown');
  const currentLayoutName = document.getElementById('currentLayoutName');
  const btnAddPanel      = document.getElementById('btnAddPanel');
  const btnSplitRight    = document.getElementById('btnSplitRight');
  const btnSplitBottom   = document.getElementById('btnSplitBottom');
  const btnResetLayout   = document.getElementById('btnResetLayout');
  const toast            = document.getElementById('toast');
  const toastMsg         = document.getElementById('toastMsg');

  // ── State ───────────────────────────────────────────────────────

  let currentLayoutId = null;
  let panelCounter = 0;
  let panels = []; // { id, url, element }
  let activePanelEl = null; // currently focused panel element

  // ── Layout Dropdown ─────────────────────────────────────────────

  function renderLayoutDropdown() {
    layoutDropdown.innerHTML = '';
    LAYOUTS.forEach(layout => {
      const item = document.createElement('button');
      item.className = 'layout-dropdown-item';
      item.dataset.layoutId = layout.id;
      item.innerHTML = createLayoutSVG(layout.panels) +
        `<span>${layout.name}</span>`;
      item.addEventListener('click', () => {
        applyPresetLayout(layout);
        closeDropdown();
      });
      layoutDropdown.appendChild(item);
    });
  }

  function createLayoutSVG(panels) {
    const svgW = 44, svgH = 30, gap = 1.2, pad = 2;
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

  function toggleDropdown() {
    layoutDropdown.classList.toggle('open');
  }

  function closeDropdown() {
    layoutDropdown.classList.remove('open');
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.layout-selector')) {
      closeDropdown();
    }
  });

  // ── Panel Creation ──────────────────────────────────────────────

  function createPanelElement(url = '') {
    const id = `panel-${++panelCounter}`;

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.dataset.panelId = id;

    // Panel bar with URL input
    const bar = document.createElement('div');
    bar.className = 'panel-bar';

    const urlInput = document.createElement('input');
    urlInput.className = 'panel-url-input';
    urlInput.type = 'text';
    urlInput.placeholder = 'Enter URL (e.g., youtube.com)';
    urlInput.value = url;
    urlInput.spellcheck = false;
    urlInput.autocomplete = 'off';

    // Reload button
    const reloadBtn = document.createElement('button');
    reloadBtn.className = 'panel-btn';
    reloadBtn.title = 'Reload';
    reloadBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel-btn close-btn';
    closeBtn.title = 'Close panel';
    closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    bar.appendChild(urlInput);
    bar.appendChild(reloadBtn);
    bar.appendChild(closeBtn);

    // Iframe wrapper
    const iframeWrapper = document.createElement('div');
    iframeWrapper.className = 'panel-iframe-wrapper';

    // Drag overlay (prevents iframe from stealing mouse during divider resize)
    const dragOverlay = document.createElement('div');
    dragOverlay.className = 'panel-drag-overlay';
    iframeWrapper.appendChild(dragOverlay);

    // Loading spinner
    const loading = document.createElement('div');
    loading.className = 'panel-loading';
    loading.innerHTML = '<div class="spinner"></div>';
    iframeWrapper.appendChild(loading);

    if (url) {
      const iframe = createIframe(url);
      iframeWrapper.appendChild(iframe);
      loading.classList.add('active');
      iframe.addEventListener('load', () => loading.classList.remove('active'));
    } else {
      // Placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'panel-placeholder';
      placeholder.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <div class="panel-placeholder-text">
          Enter a URL above<br>
          <span class="panel-placeholder-hint">Press Enter to load</span>
        </div>
      `;
      iframeWrapper.appendChild(placeholder);
    }

    panel.appendChild(bar);
    panel.appendChild(iframeWrapper);

    // ── Event handlers ──

    // URL input: navigate on Enter
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigatePanel(panel, urlInput.value.trim());
      }
    });

    // Reload
    reloadBtn.addEventListener('click', () => {
      const iframe = panel.querySelector('.panel-iframe');
      if (iframe) {
        iframe.src = iframe.src; // Force reload
      }
    });

    // Close
    closeBtn.addEventListener('click', () => {
      removePanel(panel);
    });

    // Activate on click
    panel.addEventListener('mousedown', () => {
      setActivePanel(panel);
    });

    // Track panel
    panels.push({ id, url, element: panel });

    // Auto-activate newly created panel
    setActivePanel(panel);

    return panel;
  }

  // ── Active Panel ─────────────────────────────────────────────────

  function setActivePanel(panelEl) {
    if (activePanelEl === panelEl) return;
    // Remove previous active
    if (activePanelEl) {
      activePanelEl.classList.remove('panel-active');
    }
    activePanelEl = panelEl;
    if (activePanelEl) {
      activePanelEl.classList.add('panel-active');
    }
  }

  function createIframe(url) {
    const iframe = document.createElement('iframe');
    iframe.className = 'panel-iframe';
    iframe.src = normalizeUrl(url);
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox allow-downloads allow-presentation');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    return iframe;
  }

  function normalizeUrl(url) {
    if (!url) return '';
    url = url.trim();
    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      // Check if it looks like a domain
      if (/^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z]{2,})+/.test(url)) {
        url = 'https://' + url;
      } else {
        // Treat as search query
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
      }
    }
    return url;
  }

  function navigatePanel(panelEl, url) {
    if (!url) return;

    const iframeWrapper = panelEl.querySelector('.panel-iframe-wrapper');
    const loading = panelEl.querySelector('.panel-loading');
    const urlInput = panelEl.querySelector('.panel-url-input');

    // Remove placeholder if exists
    const placeholder = iframeWrapper.querySelector('.panel-placeholder');
    if (placeholder) placeholder.remove();

    // Remove old iframe
    const oldIframe = iframeWrapper.querySelector('.panel-iframe');
    if (oldIframe) oldIframe.remove();

    // Create new iframe
    const normalizedUrl = normalizeUrl(url);
    urlInput.value = normalizedUrl;
    const iframe = createIframe(normalizedUrl);
    iframeWrapper.appendChild(iframe);

    // Show loading
    loading.classList.add('active');
    iframe.addEventListener('load', () => loading.classList.remove('active'));

    // Update state
    const panelData = panels.find(p => p.element === panelEl);
    if (panelData) panelData.url = normalizedUrl;

    // Blur input
    urlInput.blur();

    saveState();
  }

  function removePanel(panelEl) {
    // Don't remove if it's the last panel
    const allPanels = tilerContainer.querySelectorAll('.panel');
    if (allPanels.length <= 1) return;

    const parentSplit = panelEl.parentElement;
    const siblings = Array.from(parentSplit.children).filter(
      c => c !== panelEl && !c.classList.contains('divider')
    );
    const dividers = Array.from(parentSplit.children).filter(
      c => c.classList.contains('divider')
    );

    // Remove the panel and its adjacent divider
    panelEl.remove();
    if (dividers.length > 0) dividers[dividers.length - 1].remove();

    // If only one child remains in the split, unwrap it
    const remaining = Array.from(parentSplit.children).filter(
      c => !c.classList.contains('divider')
    );
    if (remaining.length === 1 && parentSplit.parentElement) {
      const child = remaining[0];
      // Redistribute flex to fill space
      child.style.flex = '1';
      if (parentSplit.parentElement === tilerContainer) {
        tilerContainer.innerHTML = '';
        tilerContainer.appendChild(child);
      } else {
        parentSplit.replaceWith(child);
      }
    } else {
      // Redistribute flex equally
      remaining.forEach(r => { r.style.flex = '1'; });
    }

    // Remove from state
    const id = panelEl.dataset.panelId;
    panels = panels.filter(p => p.id !== id);

    // Transfer active panel if needed
    if (activePanelEl === panelEl) {
      activePanelEl = null;
      const nextPanel = tilerContainer.querySelector('.panel');
      if (nextPanel) setActivePanel(nextPanel);
    }

    saveState();
  }

  // ── Divider Creation & Drag ─────────────────────────────────────

  function createDivider(direction = 'h') {
    const divider = document.createElement('div');
    divider.className = `divider divider-${direction}`;
    divider.dataset.direction = direction;

    divider.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startDividerDrag(divider, e);
    });

    return divider;
  }

  function startDividerDrag(divider, startEvent) {
    const direction = divider.dataset.direction;
    const isHorizontal = direction === 'h';
    const parent = divider.parentElement;

    // Get the two adjacent flex children
    const children = Array.from(parent.children);
    const dividerIndex = children.indexOf(divider);
    const prevEl = children[dividerIndex - 1];
    const nextEl = children[dividerIndex + 1];

    if (!prevEl || !nextEl) return;

    const parentRect = parent.getBoundingClientRect();
    const prevRect = prevEl.getBoundingClientRect();
    const nextRect = nextEl.getBoundingClientRect();

    const totalSize = isHorizontal
      ? prevRect.width + nextRect.width
      : prevRect.height + nextRect.height;

    const startPos = isHorizontal ? startEvent.clientX : startEvent.clientY;

    // Show drag state
    divider.classList.add('dragging');
    document.body.classList.add('dragging');

    // Show overlays on all panels to prevent iframe mouse stealing
    document.querySelectorAll('.panel-drag-overlay').forEach(o => o.classList.add('active'));

    function onMouseMove(e) {
      const currentPos = isHorizontal ? e.clientX : e.clientY;
      const delta = currentPos - startPos;

      const prevSize = isHorizontal ? prevRect.width : prevRect.height;
      const nextSize = isHorizontal ? nextRect.width : nextRect.height;

      let newPrevSize = prevSize + delta;
      let newNextSize = nextSize - delta;

      // Min size constraints
      const minSize = isHorizontal ? 120 : 80;
      if (newPrevSize < minSize) {
        newPrevSize = minSize;
        newNextSize = totalSize - minSize;
      }
      if (newNextSize < minSize) {
        newNextSize = minSize;
        newPrevSize = totalSize - minSize;
      }

      // Set flex based on proportional sizes
      prevEl.style.flex = `${newPrevSize / totalSize}`;
      nextEl.style.flex = `${newNextSize / totalSize}`;
    }

    function onMouseUp() {
      divider.classList.remove('dragging');
      document.body.classList.remove('dragging');
      document.querySelectorAll('.panel-drag-overlay').forEach(o => o.classList.remove('active'));
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      saveState();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // ── Apply Preset Layout ─────────────────────────────────────────

  function applyPresetLayout(layout) {
    currentLayoutId = layout.id;
    currentLayoutName.textContent = layout.name;

    // Collect existing panel URLs
    const existingUrls = panels.map(p => p.url).filter(Boolean);

    // Clear everything
    tilerContainer.innerHTML = '';
    panels = [];
    panelCounter = 0;

    const layoutPanels = layout.panels;

    // Determine layout structure by analyzing panels
    const structure = analyzeLayoutStructure(layoutPanels);

    // Build the DOM tree
    const rootEl = buildLayoutDOM(structure, existingUrls);
    tilerContainer.appendChild(rootEl);

    // Update dropdown highlight
    document.querySelectorAll('.layout-dropdown-item').forEach(item => {
      item.classList.toggle('active', item.dataset.layoutId === layout.id);
    });

    showToast(`✓ ${layout.name}`);
    saveState();
  }

  /**
   * Analyze layout panels and produce a nested split structure.
   *
   * Strategy: group panels by shared x-coordinates (vertical columns)
   * or shared y-coordinates (horizontal rows), then recurse.
   */
  function analyzeLayoutStructure(layoutPanels) {
    if (layoutPanels.length === 1) {
      return { type: 'panel', panel: layoutPanels[0] };
    }

    // Try to split into vertical columns (panels sharing the same x ranges form columns)
    const columns = groupByColumns(layoutPanels);
    if (columns.length > 1) {
      return {
        type: 'split-h',
        children: columns.map(col => {
          const normalized = col.panels.map(p => ({
            ...p,
            y: (p.y - col.y) / col.h,
            h: p.h / col.h,
            x: 0,
            w: 1,
          }));
          return {
            flex: col.w,
            node: analyzeLayoutStructure(normalized),
          };
        }),
      };
    }

    // Try to split into horizontal rows
    const rows = groupByRows(layoutPanels);
    if (rows.length > 1) {
      return {
        type: 'split-v',
        children: rows.map(row => {
          const normalized = row.panels.map(p => ({
            ...p,
            x: (p.x - row.x) / row.w,
            w: p.w / row.w,
            y: 0,
            h: 1,
          }));
          return {
            flex: row.h,
            node: analyzeLayoutStructure(normalized),
          };
        }),
      };
    }

    // Fallback: treat as a horizontal split of individual panels
    return {
      type: 'split-h',
      children: layoutPanels.map(p => ({
        flex: p.w,
        node: { type: 'panel', panel: p },
      })),
    };
  }

  function groupByColumns(panels) {
    // Find unique x boundaries
    const xStarts = [...new Set(panels.map(p => round(p.x)))].sort((a, b) => a - b);
    if (xStarts.length <= 1 && panels.length > 1) {
      // All panels start at same x — not columns
      return [{ panels, x: 0, y: 0, w: 1, h: 1 }];
    }

    const columns = [];
    const used = new Set();

    for (const xStart of xStarts) {
      const colPanels = panels.filter(p => round(p.x) === xStart && !used.has(p));
      if (colPanels.length === 0) continue;

      // Check if all panels in this group span the full height
      const colWidth = colPanels[0].w;
      const allSameWidth = colPanels.every(p => round(p.w) === round(colWidth));

      if (allSameWidth) {
        const totalH = colPanels.reduce((sum, p) => sum + p.h, 0);
        if (round(totalH) >= 0.99) {
          colPanels.forEach(p => used.add(p));
          columns.push({
            panels: colPanels,
            x: xStart,
            y: Math.min(...colPanels.map(p => p.y)),
            w: colWidth,
            h: totalH,
          });
        }
      }
    }

    if (columns.length > 1 && used.size === panels.length) {
      return columns;
    }
    return [{ panels, x: 0, y: 0, w: 1, h: 1 }];
  }

  function groupByRows(panels) {
    const yStarts = [...new Set(panels.map(p => round(p.y)))].sort((a, b) => a - b);
    if (yStarts.length <= 1 && panels.length > 1) {
      return [{ panels, x: 0, y: 0, w: 1, h: 1 }];
    }

    const rows = [];
    const used = new Set();

    for (const yStart of yStarts) {
      const rowPanels = panels.filter(p => round(p.y) === yStart && !used.has(p));
      if (rowPanels.length === 0) continue;

      const rowHeight = rowPanels[0].h;
      const allSameHeight = rowPanels.every(p => round(p.h) === round(rowHeight));

      if (allSameHeight) {
        const totalW = rowPanels.reduce((sum, p) => sum + p.w, 0);
        if (round(totalW) >= 0.99) {
          rowPanels.forEach(p => used.add(p));
          rows.push({
            panels: rowPanels,
            x: Math.min(...rowPanels.map(p => p.x)),
            y: yStart,
            w: totalW,
            h: rowHeight,
          });
        }
      }
    }

    if (rows.length > 1 && used.size === panels.length) {
      return rows;
    }
    return [{ panels, x: 0, y: 0, w: 1, h: 1 }];
  }

  function round(n) {
    return Math.round(n * 1000) / 1000;
  }

  function buildLayoutDOM(node, urls) {
    if (node.type === 'panel') {
      const url = urls.shift() || '';
      return createPanelElement(url);
    }

    const direction = node.type === 'split-h' ? 'h' : 'v';
    const container = document.createElement('div');
    container.className = node.type === 'split-h' ? 'split-h' : 'split-v';

    node.children.forEach((child, i) => {
      if (i > 0) {
        container.appendChild(createDivider(direction));
      }
      const childEl = buildLayoutDOM(child.node, urls);
      childEl.style.flex = String(child.flex);
      container.appendChild(childEl);
    });

    return container;
  }

  // ── Split Panel ─────────────────────────────────────────────────

  /**
   * Split the active panel in the given direction.
   * @param {'h'|'v'} direction — 'h' = split right, 'v' = split below
   */
  function splitPanel(direction) {
    // Fallback: if no active panel, pick the last one
    const targetPanel = activePanelEl || tilerContainer.querySelector('.panel:last-of-type');
    if (!targetPanel) {
      // No panels at all — create initial panel
      const panel = createPanelElement('');
      panel.style.flex = '1';
      const wrap = document.createElement('div');
      wrap.className = direction === 'h' ? 'split-h' : 'split-v';
      wrap.appendChild(panel);
      tilerContainer.appendChild(wrap);
      saveState();
      return;
    }

    const parent = targetPanel.parentElement;
    const splitClass = direction === 'h' ? 'split-h' : 'split-v';

    // If the parent is already a split in the same direction,
    // insert the new panel adjacent to the target
    if (parent && parent.classList.contains(splitClass)) {
      const newPanel = createPanelElement('');
      const divider = createDivider(direction);

      // Insert divider + new panel right after the target
      const nextSibling = targetPanel.nextSibling;
      parent.insertBefore(divider, nextSibling);
      parent.insertBefore(newPanel, divider.nextSibling);

      // Rebalance flex equally across all children
      const flexChildren = Array.from(parent.children).filter(
        c => !c.classList.contains('divider')
      );
      const equalFlex = 1 / flexChildren.length;
      flexChildren.forEach(c => { c.style.flex = String(equalFlex); });
    } else {
      // Wrap the target panel in a new split container
      const wrapper = document.createElement('div');
      wrapper.className = splitClass;

      // Preserve the target's flex value
      wrapper.style.flex = targetPanel.style.flex || '1';

      // Replace the target in the DOM with the wrapper
      targetPanel.parentElement.insertBefore(wrapper, targetPanel);
      targetPanel.remove();

      // Set equal flex
      targetPanel.style.flex = '1';
      const newPanel = createPanelElement('');
      newPanel.style.flex = '1';

      wrapper.appendChild(targetPanel);
      wrapper.appendChild(createDivider(direction));
      wrapper.appendChild(newPanel);
    }

    saveState();
  }

  // ── State Persistence ───────────────────────────────────────────

  function saveState() {
    const state = {
      layoutId: currentLayoutId,
      panels: panels.map(p => ({
        id: p.id,
        url: p.url || '',
      })),
      timestamp: Date.now(),
    };
    try {
      chrome.storage.local.set({ tilerState: state });
    } catch {
      // Not in extension context
    }
  }

  async function restoreState() {
    try {
      const result = await chrome.storage.local.get(['tilerState']);
      if (result.tilerState && result.tilerState.panels && result.tilerState.panels.length > 0) {
        const state = result.tilerState;
        const urls = state.panels.map(p => p.url);

        // Find the matching layout
        const layout = LAYOUTS.find(l => l.id === state.layoutId);
        if (layout) {
          currentLayoutId = layout.id;
          currentLayoutName.textContent = layout.name;

          // Clear and rebuild
          tilerContainer.innerHTML = '';
          panels = [];
          panelCounter = 0;

          const structure = analyzeLayoutStructure(layout.panels);
          const rootEl = buildLayoutDOM(structure, urls);
          tilerContainer.appendChild(rootEl);

          // Highlight active layout
          document.querySelectorAll('.layout-dropdown-item').forEach(item => {
            item.classList.toggle('active', item.dataset.layoutId === layout.id);
          });
          return true;
        }
      }
    } catch {
      // Not in extension context or no saved state
    }
    return false;
  }

  // ── Toast ───────────────────────────────────────────────────────

  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  }

  // ── Init ────────────────────────────────────────────────────────

  async function init() {
    renderLayoutDropdown();

    // Event listeners
    layoutSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    btnSplitRight.addEventListener('click', () => splitPanel('h'));
    btnSplitBottom.addEventListener('click', () => splitPanel('v'));

    btnResetLayout.addEventListener('click', () => {
      if (currentLayoutId) {
        const layout = LAYOUTS.find(l => l.id === currentLayoutId);
        if (layout) applyPresetLayout(layout);
      }
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Check for Cmd/Ctrl + R (with or without Shift)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
        if (activePanelEl) {
          e.preventDefault(); // Prevent full page reload
          
          const iframe = activePanelEl.querySelector('.panel-iframe');
          if (iframe) {
            iframe.src = iframe.src; // Reload iframe
            showToast('Panel refreshed');
          }
        }
      }
    });

    // Handle messages from content-script.js inside iframes
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      
      if (e.data.type === 'SPLITENRY_ACTIVATE_PANEL' || e.data.type === 'SPLITENRY_RELOAD_PANEL') {
        // Find which iframe sent the message
        const iframes = tilerContainer.querySelectorAll('.panel-iframe');
        for (const iframe of iframes) {
          if (iframe.contentWindow === e.source) {
            const panelEl = iframe.closest('.panel');
            if (panelEl) {
              setActivePanel(panelEl);
              
              if (e.data.type === 'SPLITENRY_RELOAD_PANEL') {
                iframe.src = iframe.src;
                showToast('Panel refreshed');
              }
            }
            break;
          }
        }
      }
    });

    // Fallback: detect focus moving into an iframe
    window.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement && document.activeElement.classList.contains('panel-iframe')) {
          const panelEl = document.activeElement.closest('.panel');
          if (panelEl) setActivePanel(panelEl);
        }
      }, 0);
    });

    // Check URL params for initial layout
    const params = new URLSearchParams(window.location.search);
    const layoutId = params.get('layout');

    if (layoutId) {
      const layout = LAYOUTS.find(l => l.id === layoutId);
      if (layout) {
        applyPresetLayout(layout);
        return;
      }
    }

    // Try restore saved state
    const restored = await restoreState();
    if (!restored) {
      // Default: 2-panel layout
      const defaultLayout = LAYOUTS.find(l => l.id === 'half-half') || LAYOUTS[1];
      applyPresetLayout(defaultLayout);
    }
  }

  init();
})();
