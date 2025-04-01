// Update the popup with current tab information
async function updatePopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Check if the current site is secure
  const isSecure = tab.url.startsWith('https://');
  const securityStatus = document.getElementById('securityStatus');
  securityStatus.className = 'status ' + (isSecure ? 'secure' : 'insecure');
  securityStatus.textContent = isSecure ? 
    'Yay! This site is secure (HTTPS)' : 
    'Oops! This site is not secure (HTTP)';

  // Get trackers for current tab
  const trackerList = document.getElementById('trackerList');
  const background = chrome.extension.getBackgroundPage();
  
  if (background && background.detectedTrackers && background.detectedTrackers[tab.id]) {
    const trackers = background.detectedTrackers[tab.id];
    
    if (trackers.size === 0) {
      trackerList.innerHTML = '<div class="tracker-item">No trackers detected</div>';
    } else {
      trackerList.innerHTML = Array.from(trackers)
        .map(tracker => `<div class="tracker-item">🚫 ${new URL(tracker).hostname}</div>`)
        .join('');
    }

    // Update total blocked count
    let totalBlocked = 0;
    Object.values(background.detectedTrackers).forEach(set => {
      totalBlocked += set.size;
    });
    document.getElementById('totalBlocked').textContent = totalBlocked;
  } else {
    trackerList.innerHTML = '<div class="tracker-item">No trackers detected</div>';
    document.getElementById('totalBlocked').textContent = '0';
  }
}

// Update popup when it's opened
document.addEventListener('DOMContentLoaded', updatePopup);

// Listen for changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    updatePopup();
  }
}); 