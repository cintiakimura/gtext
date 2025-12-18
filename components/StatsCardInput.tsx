import React, { useState } from 'react';
import { CardRank, Position, PokerPlayerState, HandType } from '../types';
import { CARD_RANKS } from '../constants';
import { normalizeHandString } from '../services/pokerService';

interface StatsCardInputProps {
  playerState: PokerPlayerState;
  onPlayerStateChange: (newState: PokerPlayerState) => void;
  onDone: () => void; // Callback to signal completion of input
}

const StatsCardInput: React.FC<StatsCardInputProps> = ({ playerState, onPlayerStateChange, onDone }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);

  const handleCardRankChange = (cardNum: 1 | 2, value: string) => {
    const newRank = value as CardRank;
    let updatedHand = playerState.hand;
    let r1 = playerState.hand?.card1.rank || '';
    let r2 = playerState.hand?.card2.rank || '';
    let type: HandType = playerState.hand?.type || 'o';

    if (cardNum === 1) r1 = newRank; else r2 = newRank;

    if (r1 && r2) { // Only try to normalize if both ranks are selected
      if (r1 === r2) {
        type = 'p';
      } else if (playerState.hand?.type === 's') { // Preserve suited if ranks change but still suited context
        type = 's';
      } else {
        type = 'o';
      }
      const tempRaw = `${r1}${r2}${type === 's' ? 's' : (type === 'o' ? 'o' : '')}`;
      updatedHand = normalizeHandString(tempRaw);
    } else {
      updatedHand = null;
    }
    
    onPlayerStateChange({
      ...playerState,
      hand: updatedHand,
    });
  };

  const handleHandTypeChange = (value: string) => {
    if (playerState.hand) {
      const { card1, card2 } = playerState.hand;
      const newType = value as HandType;
      const rawHand = `${card1.rank}${card2.rank}${newType === 's' ? 's' : (newType === 'o' ? 'o' : '')}`;
      onPlayerStateChange({
        ...playerState,
        hand: normalizeHandString(rawHand),
      });
    }
  };

  const handlePositionChange = (value: string) => {
    onPlayerStateChange({
      ...playerState,
      position: value as Position,
    });
  };

  const handleStackDepthChange = (value: string) => {
    const depth = parseInt(value, 10);
    onPlayerStateChange({
      ...playerState,
      stackDepthBB: isNaN(depth) ? 100 : depth,
    });
  };

  const handleIsVsOpenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPlayerStateChange({
      ...playerState,
      isVsOpen: e.target.checked,
    });
  };

  const handleScreenCapture = async () => {
    setIsCapturing(true);
    setCaptureMessage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setCaptureMessage('Screen captured! Please input details manually below.');

      // Stop the stream tracks after a short delay (e.g., 5 seconds)
      // In a real app with AI processing, you'd send frames to a backend here.
      setTimeout(() => {
        mediaStream.getTracks().forEach(track => track.stop());
      }, 5000);

    } catch (err) {
      console.error('Error capturing screen:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setCaptureMessage('Permission denied for screen capture. Please allow access.');
      } else {
        setCaptureMessage('Failed to capture screen.');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const currentCard1Rank = playerState.hand?.card1.rank || '';
  const currentCard2Rank = playerState.hand?.card2.rank || '';
  const currentHandType = playerState.hand?.type || 'o'; // Default to offsuit for selection

  return (
    <div className="p-1 flex flex-col h-full justify-between overflow-auto">
      <div className="grid grid-cols-2 gap-1 text-xs">
        {/* Capture Screen Button */}
        <button
          onClick={handleScreenCapture}
          disabled={isCapturing}
          className="col-span-2 py-1 bg-custom-purple hover:bg-purple-600 text-white text-xs font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Capture screen for poker information"
        >
          {isCapturing ? 'Capturing...' : 'Capture Screen'}
        </button>
        {captureMessage && (
          <p className="col-span-2 text-center text-gray-300 text-[10px] my-1">{captureMessage}</p>
        )}

        {/* Card 1 */}
        <select
          id="card1-rank-sc"
          value={currentCard1Rank}
          onChange={(e) => handleCardRankChange(1, e.target.value)}
          className="p-1 bg-gray-700 text-gray-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-custom-blue"
          aria-label="Select first card rank"
        >
          <option value="">C1</option>
          {CARD_RANKS.map((rank) => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>

        {/* Card 2 */}
        <select
          id="card2-rank-sc"
          value={currentCard2Rank}
          onChange={(e) => handleCardRankChange(2, e.target.value)}
          className="p-1 bg-gray-700 text-gray-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-custom-blue"
          aria-label="Select second card rank"
        >
          <option value="">C2</option>
          {CARD_RANKS.map((rank) => (
            <option key={rank} value={rank}>{rank}</option>
          ))}
        </select>

        {/* Hand Type */}
        <select
          id="hand-type-sc"
          value={currentHandType}
          onChange={(e) => handleHandTypeChange(e.target.value)}
          disabled={!playerState.hand || playerState.hand.card1.rank === playerState.hand.card2.rank}
          className="p-1 bg-gray-700 text-gray-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-custom-blue col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Select hand type"
        >
          <option value="o">Offsuit (o)</option>
          <option value="s">Suited (s)</option>
          {playerState.hand && playerState.hand.card1.rank === playerState.hand.card2.rank && (
            <option value="p">Pair</option>
          )}
        </select>
        
        {/* Position */}
        <select
          id="position-sc"
          value={playerState.position}
          onChange={(e) => handlePositionChange(e.target.value)}
          className="p-1 bg-gray-700 text-gray-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-custom-blue col-span-2"
          aria-label="Select player position"
        >
          {Object.values(Position).map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>

        {/* Stack Depth */}
        <input
          id="stack-depth-sc"
          type="number"
          min="10"
          max="200"
          value={playerState.stackDepthBB}
          onChange={(e) => handleStackDepthChange(e.target.value)}
          className="p-1 bg-gray-700 text-gray-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-custom-blue col-span-2"
          aria-label="Enter stack depth in big blinds"
        />

        {/* Is Vs Open */}
        <div className="flex items-center col-span-2 mt-1">
          <input
            id="is-vs-open-sc"
            type="checkbox"
            checked={playerState.isVsOpen}
            onChange={handleIsVsOpenChange}
            className="h-3 w-3 text-custom-blue rounded focus:ring-custom-blue border-gray-600 bg-gray-700"
            aria-label="Facing an open raise checkbox"
          />
          <label htmlFor="is-vs-open-sc" className="ml-1 text-xs text-gray-300">Vs Open</label>
        </div>
      </div>
      <button
        onClick={onDone}
        className="mt-2 w-full py-1 bg-custom-blue hover:bg-blue-600 text-white text-xs font-semibold rounded-md transition-colors duration-200"
        aria-label="Done with input"
      >
        Done
      </button>
    </div>
  );
};

export default StatsCardInput;