import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Grid from '../components/Grid';
import HUD from '../components/HUD'; // Assume HUD is created
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { soundManager } from '../SoundManager';

// Socket singleton or context would be better, but reusing global for now
// In real app, pass socket from App or Context
let socket;

const Game = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const matchId = location.state?.matchId;

  const [grid, setGrid] = useState([]);
  const [gameOver, setGameOver] = useState(null); // { winner, leaderboard, reason }
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins in seconds
  const [players, setPlayers] = useState([]);
  const [myState, setMyState] = useState({ energy: 0, score: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [eventMessage, setEventMessage] = useState(null);

  useEffect(() => {
    if (eventMessage) {
      const timer = setTimeout(() => setEventMessage(null), 5000); // Dismiss after 5s
      return () => clearTimeout(timer);
    }
  }, [eventMessage]);

  useEffect(() => {
    // Timer Countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!matchId) {
      navigate('/lobby');
      return;
    }

    socket = io('http://localhost:3000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Connected to Game Socket');
      socket.emit('join_match', matchId, (response) => {
        if (response.success) {
          setIsConnected(true);
          if (response.state) {
            setGrid(response.state.grid);
            setPlayers(response.state.players);

            // Sync Time (Approx)
            // In real app, server sends 'createdAt' or 'timeRemaining'
            // For MVP, reset to 5 mins on join or trust local decrement
            // Find my state
            const me = response.state.players.find(p => p.id === user.id);
            if (me) setMyState({ energy: me.energy, score: me.score });
          }
        } else {
          alert('Failed to join match: ' + response.error);
          navigate('/lobby');
        }
      });
    });

    socket.on('game_update', (update) => {
      if (update.type === 'capture') {
        if (update.index !== -1) {
          setGrid(prev => {
            const next = [...prev];
            next[update.index] = update.tile;
            return next;
          });
          soundManager.playCapture();
        }

        // Update player score
        setPlayers(prev => prev.map(p =>
          p.id === update.playerId ? { ...p, score: update.newScore, energy: update.newEnergy } : p
        ));

        if (update.playerId === user.id) {
          setMyState(prev => ({ ...prev, energy: update.newEnergy, score: update.newScore }));
        }

      } else if (update.type === 'energy_regen') {
        // Bulk update players
        const updatesMap = new Map(update.players.map(p => [p.id, p.energy]));

        setPlayers(prev => prev.map(p => {
          if (updatesMap.has(p.id)) return { ...p, energy: updatesMap.get(p.id) };
          return p;
        }));

        if (updatesMap.has(user.id)) {
          setMyState(prev => ({ ...prev, energy: updatesMap.get(user.id) }));
        }
      } else if (update.type === 'full_grid') {
        setGrid(update.grid);
      }
    });

    socket.on('game_event', (data) => {
      setEventMessage(data.message);
      soundManager.playEvent();
    });

    socket.on('game_over', (data) => {
      setGameOver(data);
      soundManager.playGameOver();
    });

    return () => {
      socket.disconnect();
    };
  }, [matchId, token]);

  const handleBlockClick = (index) => {
    if (!isConnected || gameOver) return;
    if (myState.energy < 10) {
      soundManager.playError();
      return;
    }

    // Optimistic Update (Visual only)
    // Actually, let's wait for server for "Territory Wars" to ensure no cheating illusion
    socket.emit('capture', { matchId, index });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!grid || grid.length === 0) return <div className="loading">Deploying to Warzone...</div>;

  return (
    <div className="game-wrapper">
      {eventMessage && (
        <div className="event-banner">
          <h3>⚠ WORLD EVENT ⚠</h3>
          <p>{eventMessage}</p>
        </div>
      )}
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <h1>GAME OVER</h1>
            <h2>Winner: <span style={{ color: gameOver.winner?.color }}>{gameOver.winner?.username || "No One"}</span></h2>
            <div className="leaderboard-final">
              {gameOver.leaderboard.map((p, i) => (
                <div key={p.id} className="final-row">
                  <span>#{i + 1} {p.username}</span>
                  <span>{p.score} pts</span>
                </div>
              ))}
            </div>
            <button className="neon-btn" onClick={() => navigate('/lobby')}>Return to Base</button>
          </div>
        </div>
      )}

      <HUD
        energy={myState.energy}
        score={myState.score}
        timer={formatTime(timeLeft)}
        leaderboard={players.sort((a, b) => b.score - a.score).slice(0, 5)}
      />

      <button
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}
        onClick={() => navigate('/lobby')}
        className="neon-btn small"
      >
        Retreat
      </button>

      <Grid grid={grid} onBlockClick={handleBlockClick} />
    </div>
  );
};

export default Game;
