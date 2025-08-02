// Background script for Chrome extension
console.log('Leetest Code extension background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
  
  // Set up default storage values
  chrome.storage.sync.set({
    extensionEnabled: true,
    settings: {
      theme: 'light',
      notifications: true
    }
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'getSettings':
      chrome.storage.sync.get(['settings'], (result) => {
        sendResponse(result.settings);
      });
      return true; // Keep message channel open
      
    case 'saveSettings':
      chrome.storage.sync.set({ settings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'toggleExtension':
      chrome.storage.sync.get(['extensionEnabled'], (result) => {
        const newState = !result.extensionEnabled;
        chrome.storage.sync.set({ extensionEnabled: newState }, () => {
          sendResponse({ enabled: newState });
        });
      });
      return true;
      
    default:
      console.log('Unknown action:', request.action);
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
    // Add any tab-specific logic here
  }
});