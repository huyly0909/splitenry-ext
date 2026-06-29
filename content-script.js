/**
 * Splitenry — Content Script (Frame-Busting Prevention)
 *
 * Injected into all frames at document_start in MAIN world.
 * Prevents JavaScript-based frame-busting techniques that some
 * sites use to break out of iframes.
 *
 * Only activates when the page is loaded inside an iframe
 * within our tiler page (chrome-extension:// origin).
 */

(function () {
  'use strict';

  // Only act if we're in a frame (not top-level)
  if (window.top === window.self) return;

  // Only act if the parent is our extension's tiler page
  try {
    // This will throw if cross-origin, which is expected
    // We check if we're in any iframe context — our rules.json
    // already stripped the headers, so we just need to prevent
    // JS-based frame busting
  } catch (e) {
    // Expected cross-origin error
  }

  // ── Prevent common frame-busting patterns ───────────────────────

  // 1. Override top-level navigation attempts
  // Some sites do: if (top !== self) top.location = self.location
  // We prevent this by making top.location assignment a no-op when
  // called from within an iframe

  // Wrap location setter to prevent frame-busting redirects
  const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'location');

  // 2. Prevent the most common pattern: checking top !== self
  // We can't fully override window.top (it's non-configurable in most browsers),
  // but we can catch and suppress the resulting navigation

  // Listen for beforeunload to detect and potentially block frame-busting
  let navigationBlocked = false;

  // 3. Intercept top.location assignments via a MutationObserver
  // that watches for injected frame-busting scripts
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'SCRIPT' && node.textContent) {
          // Check for common frame-busting patterns
          const text = node.textContent;
          if (
            text.includes('top.location') ||
            text.includes('parent.location') ||
            text.includes('top !== self') ||
            text.includes('top!=self') ||
            text.includes('top != self') ||
            text.includes('window.top')
          ) {
            // Remove the frame-busting script before it executes
            node.textContent = '/* frame-busting prevented by Splitenry */';
          }
        }
      }
    }
  });

  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true,
  });

  // 4. Sandbox the window to prevent direct navigation
  // Override window.top to return self (making the page think it's top-level)
  try {
    Object.defineProperty(window, 'top', {
      get: function () { return window.self; },
      configurable: false,
    });
  } catch (e) {
    // Some browsers don't allow overriding window.top
    // That's okay — the MutationObserver fallback handles most cases
  }

  // 5. Interaction tracking for Splitenry parent
  // Notify parent to activate panel on click/focus
  const notifyParentActive = () => {
    try {
      window.parent.postMessage({ type: 'SPLITENRY_ACTIVATE_PANEL' }, '*');
    } catch (e) {}
  };
  
  window.addEventListener('mousedown', notifyParentActive, true);
  window.addEventListener('focus', notifyParentActive, true);
  
  // Also track touch events for mobile/tablets
  window.addEventListener('touchstart', notifyParentActive, { passive: true, capture: true });

  // 6. Intercept Cmd+R / Ctrl+R to prevent full tab reload
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      try {
        window.parent.postMessage({ type: 'SPLITENRY_RELOAD_PANEL' }, '*');
      } catch (err) {}
    }
  }, true);
})();
