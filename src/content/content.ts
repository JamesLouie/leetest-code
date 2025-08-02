// Content script for Chrome extension
import { getCurrentPageInfo } from './leetcode-detector';

console.log('Leetest Code extension content script loaded');

// Check if current page is a LeetCode problem
const pageInfo = getCurrentPageInfo();

// Only show extension message on LeetCode problem pages
if (pageInfo.isLeetCodeProblem) {  
  // Show extension activation message
  const extensionMessage = document.createElement('div');
  extensionMessage.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  extensionMessage.textContent = '🧩 Leetest Code Extension Active!';
  extensionMessage.id = 'leetest-extension-message';

  // Add the message for 3 seconds
  document.body.appendChild(extensionMessage);
  setTimeout(() => {
    const message = document.getElementById('leetest-extension-message');
    if (message && message.parentNode) {
      message.parentNode.removeChild(message);
    }
  }, 3000);
} else {
  console.log('Not a LeetCode problem page, extension inactive');
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  switch (request.action) {
    case 'getData':
      // Get basic page data
      { const pageData = {
        title: document.title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        isLeetCodeProblem: pageInfo.isLeetCodeProblem,
        problemSlug: pageInfo.problemSlug,
        pageType: pageInfo.pageType
      };
      sendResponse(pageData);
      break; }
      
    case 'checkLeetCodePage':
      // Check if current page is a LeetCode problem
      sendResponse({
        isLeetCodeProblem: pageInfo.isLeetCodeProblem,
        problemSlug: pageInfo.problemSlug,
        pageType: pageInfo.pageType
      });
      break;
      
    default:
      console.log('Unknown action:', request.action);
      sendResponse({ error: 'Unknown action' });
  }
  
  return true; // Keep the message channel open for async response
});

// Listen for page navigation events
let currentUrl = window.location.href;

// Check for URL changes (for SPA navigation)
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('URL changed to:', currentUrl);
    
    // Re-check if it's a LeetCode problem page
    const newPageInfo = getCurrentPageInfo();
    if (newPageInfo.isLeetCodeProblem) {
      console.log('New LeetCode problem detected:', newPageInfo.problemSlug);
      // You can add additional logic here for page changes
    }
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});