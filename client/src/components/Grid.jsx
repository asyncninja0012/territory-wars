import React from 'react';
import { Lock } from 'lucide-react';

const Grid = ({ grid, onBlockClick }) => {
  return (
    <div className="grid-container">
      {grid.map((cell, index) => {
        // cell might be null or { ownerId, color, lockedUntil, zoneId }
        const isOwned = cell && cell.color;
        const isLocked = cell && cell.lockedUntil > Date.now();

        // Zone visual: check if bottom/right border needed (every 10th col/row)
        const row = Math.floor(index / 30);
        const col = index % 30;
        const isZoneBorderRight = (col + 1) % 10 === 0 && (col + 1) !== 30;
        const isZoneBorderBottom = (row + 1) % 10 === 0 && (row + 1) !== 30;

        const style = {
          ...(isOwned ? {
            backgroundColor: cell.color,
            boxShadow: `0 0 10px ${cell.color}`,
            opacity: isLocked ? 0.6 : 1
          } : {}),
          borderRight: isZoneBorderRight ? '2px solid rgba(255,255,255,0.1)' : undefined,
          borderBottom: isZoneBorderBottom ? '2px solid rgba(255,255,255,0.1)' : undefined
        };

        return (
          <div
            key={index}
            className={`block ${isOwned ? 'owned' : ''} ${isLocked ? 'locked' : ''}`}
            style={style}
            onClick={() => onBlockClick(index)}
          >
            {isLocked && (
              <div className="lock-icon">
                <Lock size={12} color="white" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Grid;
