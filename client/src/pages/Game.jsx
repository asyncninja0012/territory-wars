import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Grid from '../components/Grid';
import { useNavigate } from 'react-router-dom';

// Connect to backend
const socket = io('http://localhost:3000', {
  autoConnect: false
});

const ROW_SIZE = 30;
const COL_SIZE = 30;
const TOTAL_BLOCKS = ROW_SIZE * COL_SIZE;

const Game = () => {
  const [grid, setGrid] = useState(Array(TOTAL_BLOCKS).fill(null));
  const [isConnected, setIsConnected] = useState(false);
  const [myColor, setMyColor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onInit(initialGrid, assignedColor) {
      setGrid(initialGrid);
      setMyColor(assignedColor);
    }

    function onUpdate({ index, color }) {
      setGrid(prev => {
        const next = [...prev];
        next[index] = { color };
        return next;
      });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('init', onInit);
    socket.on('update', onUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('init', onInit);
      socket.off('update', onUpdate);
      socket.disconnect();
    };
  }, []);

  const handleBlockClick = (index) => {
    if (!isConnected) return;
    socket.emit('capture', index);
  };

  return (
    <div className="game-wrapper">
      <button
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}
        onClick={() => navigate('/lobby')}
        className="neon-btn"
      >
        Back to Lobby
      </button>

      <div className="title">Territory Wars</div>
      <div className="status-bar">
        <span>Status: {isConnected ? 'Online' : 'Connecting...'}</span>
        {myColor && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            You are:
            <span
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: myColor,
                display: 'inline-block',
                borderRadius: '50%',
                boxShadow: `0 0 5px ${myColor}`
              }}
            />
          </span>
        )}
      </div>
      <Grid grid={grid} onBlockClick={handleBlockClick} />
    </div>
  );
};

export default Game;
