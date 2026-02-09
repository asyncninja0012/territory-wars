import React from 'react';
import { Lock, Zap, Shield, Bomb, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const Grid = ({ grid, onBlockDown, onBlockUp, activeCaptures = {}, players = [], zoneDominance = {}, userId }) => {
  // Helper to get Icon based on type
  const getIcon = (type) => {
    switch (type) {
      case 'ENERGY': return <Zap size={14} color="#FFD700" />;
      case 'FORTRESS': return <Shield size={14} color="#00BFFF" />;
      case 'BOMB': return <Bomb size={14} color="#FF4500" />;
      case 'DATA': return <Database size={14} color="#32CD32" />;
      default: return null;
    }
  };

  return (
    <div className="grid-container">
      {grid.map((cell, index) => {
        const isOwned = cell && cell.ownerId;
        const owner = isOwned ? players.find(p => p.id === cell.ownerId) : null;
        const color = owner ? owner.color : (cell?.color || null);
        const isLocked = cell && cell.lockedUntil > Date.now();

        // Active Capture Info
        const captureInfo = activeCaptures[index];
        const isBeingCaptured = !!captureInfo;
        const capturer = isBeingCaptured ? players.find(p => p.id === captureInfo.playerId) : null;
        const capturerColor = capturer ? capturer.color : 'white';

        // Zone Visuals
        const row = Math.floor(index / 30);
        const col = index % 30;
        const isZoneBorderRight = (col + 1) % 10 === 0 && (col + 1) !== 30;
        const isZoneBorderBottom = (row + 1) % 10 === 0 && (row + 1) !== 30;

        // Dominance Visuals
        const isDominated = cell && zoneDominance[cell.zoneId] === userId;
        const dominationColor = isDominated ? 'gold' : (zoneDominance[cell?.zoneId] ? 'rgba(255,0,0,0.3)' : null);

        const style = {
          backgroundColor: color || 'rgba(255, 255, 255, 0.05)',
          boxShadow: color ? `0 0 8px ${color}` : (dominationColor ? `inset 0 0 0 2px ${dominationColor}` : 'none'),
          opacity: isLocked ? 0.6 : 1,
          borderRight: isZoneBorderRight ? '2px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: isZoneBorderBottom ? '2px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
        };

        return (
          <div
            key={index}
            className={`block`}
            style={style}
            onMouseDown={() => onBlockDown && onBlockDown(index)}
            onMouseUp={() => onBlockUp && onBlockUp(index)}
            onMouseLeave={() => onBlockUp && onBlockUp(index)}
            onTouchStart={() => onBlockDown && onBlockDown(index)}
            onTouchEnd={() => onBlockUp && onBlockUp(index)}
          >
            {/* Special Tile Icon */}
            {cell && cell.type !== 'NORMAL' && !isOwned && (
              <div className="special-icon" style={{ pointerEvents: 'none' }}>
                {getIcon(cell.type)}
              </div>
            )}

            {/* Lock Icon */}
            {isLocked && (
              <div className="lock-icon">
                <Lock size={12} color="white" />
              </div>
            )}

            {/* Capture Progress Ring */}
            {isBeingCaptured && (
              <div className="capture-overlay">
                <motion.div
                  className="capture-ring"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: captureInfo.duration / 1000, ease: "linear" }}
                  style={{ border: `3px solid ${capturerColor}` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Grid;
