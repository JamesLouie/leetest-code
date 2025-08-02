// Content script for Chrome extension
console.log('Leetest Code extension content script loaded');

// Example: Add a message to the page
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
`;
extensionMessage.textContent = 'Leetest Code Extension Active!';

// Add the message for 3 seconds
document.body.appendChild(extensionMessage);
setTimeout(() => {
  if (extensionMessage.parentNode) {
    extensionMessage.parentNode.removeChild(extensionMessage);
  }
}, 3000);

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'getData') {
    // Example: Get page data
    const pageData = {
      title: document.title,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    sendResponse(pageData);
  }
  
  return true; // Keep the message channel open for async response
});