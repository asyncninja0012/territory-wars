import React from 'react';

const Grid = ({ grid, onBlockClick, myId }) => {
  return (
    <div className="grid-container">
      {grid.map((cell, index) => {
        const isOwned = cell !== null;
        const style = isOwned ? { backgroundColor: cell.color, boxShadow: `0 0 10px ${cell.color}` } : {};
        
        return (
          <div
            key={index}
            className={`block ${isOwned ? 'owned' : ''}`}
            style={style}
            onClick={() => onBlockClick(index)}
          />
        );
      })}
    </div>
  );
};

export default Grid;
