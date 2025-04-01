// Store detected trackers
let detectedTrackers = {};

// Common tracker domains and patterns
const trackerPatterns = [
  'google-analytics.com',
  'doubleclick.net',
  'facebook.com/tr',
  'analytics',
  'tracker',
  'pixel'
];

// Check if a URL contains tracker patterns
function isTracker(url) {
  return trackerPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

// Check if website is secure (HTTPS)
function isSecure(url) {
  return url.startsWith('https://');
}

// Listen for web requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (isTracker(details.url)) {
      const tabId = details.tabId;
      if (!detectedTrackers[tabId]) {
        detectedTrackers[tabId] = new Set();
      }
      detectedTrackers[tabId].add(details.url);
      
      // Update badge with number of trackers
      chrome.action.setBadgeText({
        text: detectedTrackers[tabId].size.toString(),
        tabId: tabId
      });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    }
  },
  { urls: ["<all_urls>"] }
);

// Create rules to block trackers
const rules = trackerPatterns.map((pattern, index) => ({
  id: index + 1,
  priority: 1,
  action: { type: "block" },
  condition: {
    urlFilter: pattern,
    resourceTypes: ["xmlhttprequest", "image", "script", "sub_frame"]
  }
}));

// Update dynamic rules
chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: rules.map(rule => rule.id),
  addRules: rules
});

// Listen for tab updates to check HTTPS
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const secure = isSecure(tab.url);
    if (!secure) {
      chrome.action.setBadgeText({
        text: '!',
        tabId: tabId
      });
      chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });
    }
  }
});

// Clear tracker data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete detectedTrackers[tabId];
}); 