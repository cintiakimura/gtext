// Fix: Declare global 'chrome' object to resolve TypeScript errors
declare var chrome: any;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GTOAdvice, PokerPlayerState } from '../types';
import { getPreflopAdvice } from '../services/pokerService';
import StatsCardInput from './StatsCardInput';


interface StatsCardProps {
  id: string;
  initialX: number;
  initialY: number;
  playerState: PokerPlayerState;
  onDragEnd: (id: string, x: number, y: number) => void;
  onRemoveCard: (id: string) => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ id, initialX, initialY, playerState: initialPlayerState, onDragEnd, onRemoveCard }) => {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const [internalPlayerState, setInternalPlayerState] = useState<PokerPlayerState>(initialPlayerState);
  const [advice, setAdvice] = useState<GTOAdvice | null>(null);
  const [editMode, setEditMode] = useState<boolean>(!initialPlayerState.hand); // Start in edit mode if no hand

  // Recalculate advice when internalPlayerState changes
  const calculateAdvice = useCallback(() => {
    if (internalPlayerState.hand) {
      setAdvice(getPreflopAdvice(internalPlayerState));
    } else {
      setAdvice(null);
    }
  }, [internalPlayerState]);

  useEffect(() => {
    calculateAdvice();
  }, [calculateAdvice]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current && !editMode) { // Only allow dragging if not in edit mode
      setIsDragging(true);
      const rect = cardRef.current.getBoundingClientRect();
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      // Prevent default to avoid selection issues during drag
      e.preventDefault();
    }
  }, [editMode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    onDragEnd(id, position.x, position.y);
  }, [id, position, onDragEnd]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev);
  }, []);

  const handleDoneInput = useCallback(() => {
    if (internalPlayerState.hand) { // Only exit edit mode if a hand is selected
      setEditMode(false);
      // Recalculate advice with potentially new data
      calculateAdvice(); 
      // Save the updated state to storage
      // Fix: Check if chrome.storage is available before using it
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get('gtoPulseCards', (result) => {
          const allCards = result.gtoPulseCards || {};
          const updatedCardData = { ...allCards[id], playerState: internalPlayerState };
          allCards[id] = updatedCardData;
          chrome.storage.local.set({ gtoPulseCards: allCards });
        });
      }
    }
  }, [internalPlayerState.hand, internalPlayerState, id, calculateAdvice]);


  const cardClasses = `
    absolute text-white p-2 rounded-lg shadow-xl transition-colors duration-200
    w-48 h-28 flex flex-col justify-between text-sm
    ${advice ? advice.colorClass : 'bg-custom-gray'}
    ${isDragging ? 'z-50 ring-2 ring-custom-blue' : ''}
    ${editMode ? '' : 'cursor-grab'}
  `;

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      className={cardClasses}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      aria-label={`Stats card for hand ${internalPlayerState.hand?.raw || 'not set'}`}
    >
      <button
        onClick={toggleEditMode}
        className="absolute top-1 right-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-1 rounded-full z-10"
        aria-label={editMode ? 'Close input fields' : 'Edit player state'}
      >
        {editMode ? '✖' : '✎'}
      </button>
      <button
        onClick={() => onRemoveCard(id)}
        className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white text-xs px-1 rounded-full z-10"
        aria-label="Remove stats card"
      >
        &times;
      </button>

      {editMode ? (
        <StatsCardInput
          playerState={internalPlayerState}
          onPlayerStateChange={setInternalPlayerState}
          onDone={handleDoneInput}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-base">
              {internalPlayerState.hand?.raw || 'No Hand'}
              {advice && <span className="text-xs font-normal ml-1 opacity-80">({advice.strength})</span>}
            </span>
            <span className="text-xs text-gray-200">{internalPlayerState.position} - {internalPlayerState.stackDepthBB}bb</span>
          </div>
          {advice ? (
            <>
              <div className="text-center font-extrabold text-2xl tracking-wide">
                {advice.action}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Equity: {advice.equity}%</span>
                <span className="truncate max-w-[60%]">{advice.insight.split('(')[0].trim()}</span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-800 text-lg font-semibold flex-grow flex items-center justify-center">
              No Advice (select a hand)
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatsCard;