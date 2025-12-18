// Fix: Declare global 'chrome' object to resolve TypeScript errors
declare var chrome: any;
// This file will be compiled to background.js
// Fix: Check if chrome.runtime is available before using it
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'createStatsCard') {
      // Forward the message to the active tab's content script
      // Fix: Check if chrome.tabs is available before using it
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'injectStatsCard',
              playerState: message.playerState,
              cardId: message.cardId,
            });
          }
        });
      }
      sendResponse({ status: 'Card creation message sent' });
    } else if (message.action === 'updateStatsCardPosition' || message.action === 'removeStatsCard') {
      // These actions are typically handled by content script locally or saved to storage
      // but the background script can be a central point if global state or more complex logic is needed.
      // For now, simply acknowledge.
      sendResponse({ status: 'Acknowledged' });
    }
    // Keep the message channel open for sendResponse to be called asynchronously.
    return true; 
  });
}

console.log('GTO Pulse background service worker started.');