// Fix: Declare global 'chrome' object to resolve TypeScript errors
declare var chrome: any;
import React from 'react';
import ReactDOM from 'react-dom/client';
import StatsCard from './components/StatsCard';
import { PokerPlayerState, StatsCardData, Position } from './types';
import { getPreflopAdvice } from './services/pokerService';


// Inject Tailwind CSS into the host page (less ideal, but works for simple cases)
const injectTailwindCSS = () => {
  const link = document.createElement('link');
  link.href = 'https://cdn.tailwindcss.com';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // Inject custom Tailwind config if necessary (e.g., extend colors)
  const style = document.createElement('style');
  style.textContent = `
    html, body {
        overflow: auto !important; /* Prevent page overflow issues from fixed elements */
    }
    .custom-stats-card-container {
        position: fixed;
        z-index: 2147483647; /* Max z-index to ensure it floats above everything */
    }
    `;
  document.head.appendChild(style);
};

injectTailwindCSS();

interface StatsCardInstance {
  cardId: string;
  root: ReactDOM.Root;
  container: HTMLDivElement;
}

const statsCardInstances = new Map<string, StatsCardInstance>();

const renderStatsCard = (cardData: StatsCardData) => {
  let container: HTMLDivElement | null = document.getElementById(`gto-pulse-stats-card-container-${cardData.id}`) as HTMLDivElement | null;
  let root: ReactDOM.Root;

  if (!container) {
    container = document.createElement('div');
    container.id = `gto-pulse-stats-card-container-${cardData.id}`;
    container.className = 'custom-stats-card-container';
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    statsCardInstances.set(cardData.id, { cardId: cardData.id, root, container });
  } else {
    root = statsCardInstances.get(cardData.id)!.root;
  }

  if (container) {
    container.style.left = `${cardData.position.x}px`;
    container.style.top = `${cardData.position.y}px`;
  }

  root.render(
    <React.StrictMode>
      <StatsCard
        id={cardData.id}
        initialX={cardData.position.x}
        initialY={cardData.position.y}
        playerState={cardData.playerState}
        onDragEnd={(id, x, y) => {
          const updatedCardData = { ...cardData, position: { x, y } };
          saveCardState(id, updatedCardData);
        }}
        onRemoveCard={(id) => {
          removeCard(id);
        }}
      />
    </React.StrictMode>
  );
};

const saveCardState = (cardId: string, cardData: StatsCardData) => {
  // Fix: Check if chrome.storage is available before using it
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('gtoPulseCards', (result) => {
      const allCards = result.gtoPulseCards || {};
      allCards[cardId] = cardData;
      chrome.storage.local.set({ gtoPulseCards: allCards });
    });
  }
};

const removeCard = (cardId: string) => {
  // Fix: Check if chrome.storage is available before using it
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('gtoPulseCards', (result) => {
      const allCards = result.gtoPulseCards || {};
      delete allCards[cardId];
      chrome.storage.local.set({ gtoPulseCards: allCards }, () => {
        const instance = statsCardInstances.get(cardId);
        if (instance) {
          instance.root.unmount();
          instance.container.remove();
          statsCardInstances.delete(cardId);
        }
      });
    });
  }
};

// Fix: Define loadAndRenderAllCards before its usage
const loadAndRenderAllCards = () => {
  // Fix: Check if chrome.storage is available before using it
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('gtoPulseCards', (result) => {
      const allCards: { [key: string]: StatsCardData } = result.gtoPulseCards || {};
      for (const cardId in allCards) {
        renderStatsCard(allCards[cardId]);
      }
    });
  }
};

// Initial load of cards when content script is injected
loadAndRenderAllCards();

// Listen for messages from the background script
// Fix: Check if chrome.runtime is available before using it
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'injectStatsCard') {
      const newCardData: StatsCardData = {
        id: message.cardId,
        playerState: message.playerState,
        advice: getPreflopAdvice(message.playerState), // Calculate initial advice
        position: { x: window.innerWidth - 200, y: 10 }, // Top-right corner by default
      };
      renderStatsCard(newCardData);
      saveCardState(newCardData.id, newCardData);
      sendResponse({ status: 'StatsCard injected successfully' });
    }
    return true; // Keep the message channel open for sendResponse
  });
}

console.log('GTO Pulse content script loaded.');