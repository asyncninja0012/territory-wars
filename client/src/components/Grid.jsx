import React, { useState, useRef } from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Grid = ({ grid, onBlockClick }) => {
  const [capturing, setCapturing] = useState(null); // { index, progress }
  const captureTimeout = useRef(null);
  const CAPTURE_TIME = 800; // ms to hold

  const handleMouseDown = (index) => {
    // Check if captureable (not locked)
    const cell = grid[index];
    if (cell && cell.lockedUntil > Date.now()) return;

    setCapturing({ index });

    // Trigger capture after delay
    captureTimeout.current = setTimeout(() => {
      onBlockClick(index); // Trigger actual capture
      setCapturing(null);
    }, CAPTURE_TIME);
  };

  const cancelCapture = () => {
    if (captureTimeout.current) {
      clearTimeout(captureTimeout.current);
      captureTimeout.current = null;
    }
    setCapturing(null);
  };

  return (
    <div className="grid-container">
      {grid.map((cell, index) => {
        // cell might be null or { ownerId, color, lockedUntil, zoneId }
        const isOwned = cell && cell.color;
        const isLocked = cell && cell.lockedUntil > Date.now();
        const isCapturing = capturing?.index === index;

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
            onMouseDown={() => handleMouseDown(index)}
            onMouseUp={cancelCapture}
            onMouseLeave={cancelCapture}
            // For mobile compatibility, maybe onTouchStart/End too
            onTouchStart={() => handleMouseDown(index)}
            onTouchEnd={cancelCapture}
          >
            {isCapturing && (
              <div className="capture-overlay">
                <motion.div
                  className="capture-ring"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: CAPTURE_TIME / 1000, ease: "easeOut" }}
                />
              </div>
            )}
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
