/**
 * Splitenry v2 — Background Service Worker
 *
 * Simplified: manages opening/reusing the tiler tab.
 */

// ── Open or focus the tiler tab ─────────────────────────────────

async function openTilerTab(layoutId) {
  const tilerUrl = chrome.runtime.getURL('tiler.html');

  // Check if tiler tab is already open
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(t => t.url && t.url.startsWith(tilerUrl));

  if (existing) {
    // Focus existing tab
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });

    // If a specific layout was requested, reload with that layout
    if (layoutId) {
      await chrome.tabs.update(existing.id, {
        url: `${tilerUrl}?layout=${layoutId}`,
      });
    }
  } else {
    // Create new tab
    const url = layoutId ? `${tilerUrl}?layout=${layoutId}` : tilerUrl;
    await chrome.tabs.create({ url });
  }
}

// ── Message handler (from popup) ────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openTiler') {
    openTilerTab(message.layoutId).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true; // Keep channel open for async
  }

  if (message.action === 'getWindowInfo') {
    handleGetWindowInfo().then(sendResponse);
    return true;
  }
});

async function handleGetWindowInfo() {
  try {
    const allWindows = await chrome.windows.getAll({ populate: true });
    const totalTabs = allWindows.reduce((sum, w) => sum + (w.tabs ? w.tabs.length : 0), 0);
    return {
      success: true,
      totalWindows: allWindows.length,
      totalTabs,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
