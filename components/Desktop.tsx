// Fix: Declare global 'chrome' object to resolve TypeScript errors
declare var chrome: any;
import React from 'react';
import { Position, PokerPlayerState } from '../types';


interface DesktopProps {
  // onCreateStatsCard prop is removed as it now communicates via messages
}

const Desktop: React.FC<DesktopProps> = () => {
  const generateUniqueId = () => `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleCreateCard = () => {
    const newCardId = generateUniqueId();
    // Create a default player state for the new card
    const defaultPlayerState: PokerPlayerState = {
      hand: null,
      position: Position.UTG, // Default position
      stackDepthBB: 100,      // Default stack depth
      isVsOpen: false,         // Default to not facing an open
    };

    // Send a message to the background script to create a card in the active tab
    // Fix: Check if chrome.runtime is available before using it
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage(
        { action: 'createStatsCard', playerState: defaultPlayerState, cardId: newCardId },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
          } else {
            console.log('Response from background:', response);
          }
        }
      );
    }
  };

  return (
    <div className="bg-custom-dark-gray p-6 rounded-xl shadow-2xl border border-gray-700 flex flex-col items-center justify-center w-48 h-48">
      <h2 className="text-xl font-bold text-gray-100 mb-4 text-center">GTO Pulse</h2>
      <button
        onClick={handleCreateCard}
        className="w-full py-2 px-4 bg-custom-green hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-75"
        aria-label="Create a new statistics card"
      >
        Create New Card
      </button>
    </div>
  );
};

export default Desktop;