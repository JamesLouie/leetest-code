// Content script for Chrome extension
import { getCurrentPageInfo } from './leetcode-detector';
import { LeetCodeParser } from './leetcode-parser';

import { errorHandler } from './error-handler';

console.log('Leetest Code extension content script loaded');

// Initialize parser
const parser = new LeetCodeParser();

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

    case 'parseProblem':
      // Parse LeetCode problem data
      handleProblemParsing(sendResponse);
      break;

    case 'getProblemData':
      // Get parsed problem data with error handling
      handleGetProblemData(sendResponse);
      break;

    case 'getErrorLogs':
      // Get error logs and statistics
      sendResponse({
        success: true,
        logs: errorHandler.getRecentLogs(request.count || 10),
        stats: errorHandler.getErrorStats(),
        performance: errorHandler.getPerformanceMetrics()
      });
      break;

    case 'setDebugMode':
      // Enable/disable debug mode
      errorHandler.setDebugMode(request.enabled || false);
      sendResponse({
        success: true,
        debugMode: errorHandler.setDebugMode(request.enabled || false)
      });
      break;
      
    default:
      errorHandler.warn('Unknown action received', { action: request.action });
      sendResponse({ error: 'Unknown action' });
  }
  
  return true; // Keep the message channel open for async response
});

/**
 * Handle problem parsing with comprehensive error handling
 */
async function handleProblemParsing(sendResponse: (response: unknown) => void) {
  try {
    errorHandler.info('Starting problem parsing from content script...');
    
    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      errorHandler.info('Waiting for page to load completely...');
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await parser.parseProblem();
    
    if (result.success) {
      errorHandler.info('Problem parsing successful', { 
        title: result.data?.title,
        difficulty: result.data?.difficulty 
      });
      sendResponse({
        success: true,
        data: result.data,
        warnings: result.warnings || []
      });
    } else {
      errorHandler.error('Problem parsing failed', { error: result.error });
      sendResponse({
        success: false,
        error: result.error,
        warnings: result.warnings || []
      });
    }
  } catch (error) {
    errorHandler.error('Unexpected error during problem parsing', { error });
    sendResponse({
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      warnings: ['An unexpected error occurred during parsing']
    });
  }
}

/**
 * Handle getting problem data with caching
 */
let cachedProblemData: unknown = null;
let lastParseTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function handleGetProblemData(sendResponse: (response: unknown) => void) {
  try {
    const now = Date.now();
    
    // Return cached data if it's still valid
    if (cachedProblemData && (now - lastParseTime) < CACHE_DURATION) {
      errorHandler.debug('Returning cached problem data');
      sendResponse({
        success: true,
        data: cachedProblemData,
        cached: true
      });
      return;
    }

    // Parse fresh data
    errorHandler.info('Parsing fresh problem data...');
    const result = await parser.parseProblem();
    
    if (result.success) {
      cachedProblemData = result.data;
      lastParseTime = now;
      
      errorHandler.info('Problem data cached successfully');
      sendResponse({
        success: true,
        data: result.data,
        warnings: result.warnings || [],
        cached: false
      });
    } else {
      errorHandler.error('Failed to parse problem data', { error: result.error });
      sendResponse({
        success: false,
        error: result.error,
        warnings: result.warnings || []
      });
    }
  } catch (error) {
    errorHandler.error('Error getting problem data', { error });
    sendResponse({
      success: false,
      error: `Error getting problem data: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// Listen for page navigation events
let currentUrl = window.location.href;

// Check for URL changes (for SPA navigation)
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('URL changed to:', currentUrl);
    
    // Clear cache on navigation
    cachedProblemData = null;
    lastParseTime = 0;
    
    // Re-check if it's a LeetCode problem page
    const newPageInfo = getCurrentPageInfo();
    if (newPageInfo.isLeetCodeProblem) {
      console.log('New LeetCode problem detected:', newPageInfo.problemSlug);
      
      // Show extension message for new problem
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
      extensionMessage.textContent = '🧩 New Problem Detected!';
      extensionMessage.id = 'leetest-extension-message';

      // Remove existing message if any
      const existingMessage = document.getElementById('leetest-extension-message');
      if (existingMessage && existingMessage.parentNode) {
        existingMessage.parentNode.removeChild(existingMessage);
      }

      // Add the message for 3 seconds
      document.body.appendChild(extensionMessage);
      setTimeout(() => {
        const message = document.getElementById('leetest-extension-message');
        if (message && message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 3000);
    }
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle page load events
window.addEventListener('load', () => {
  console.log('Page loaded, checking for LeetCode problem...');
  const pageInfo = getCurrentPageInfo();
  if (pageInfo.isLeetCodeProblem) {
    console.log('LeetCode problem page loaded:', pageInfo.problemSlug);
  }
});

// Handle DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');
});