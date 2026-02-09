import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Plus, Users, Play } from 'lucide-react';
import io from 'socket.io-client';

// We need a persistent socket connection for the lobby
let socket;

const Lobby = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        // Initialize socket with Auth Token
        socket = io('http://localhost:3000', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Connected to Lobby Socket');
            socket.emit('join_lobby');
        });

        socket.on('lobby_update', (activeMatches) => {
            setMatches(activeMatches);
        });

        return () => {
            socket.disconnect();
        };
    }, [token]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const createMatch = () => {
        const matchName = `${user.username}'s War`;
        socket.emit('create_match', { name: matchName, config: { maxPlayers: 10 } }, (response) => {
            if (response.success) {
                // Just navigate, let Game.jsx handle the joining via socket
                navigate('/game', { state: { matchId: response.matchId } });
            }
        });
    };

    const joinMatch = (id) => {
        // Just navigate, let Game.jsx handle the joining via socket
        navigate('/game', { state: { matchId: id } });
    };

    return (
        <div className="lobby-container">
            <nav className="lobby-nav">
                <div className="logo neon-text">Territory Wars</div>
                <div className="user-info">
                    <span style={{ color: user?.color }} className="user-badge">
                        {user?.username} (Wins: {user?.wins || 0})
                    </span>
                    <button onClick={handleLogout} className="icon-btn" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <div className="lobby-content">
                <header className="lobby-header">
                    <h2>Active Warzones</h2>
                    <button className="neon-btn create-btn" onClick={createMatch}>
                        <Plus size={18} /> Quick Create Match
                    </button>
                </header>

                <div className="match-list">
                    {matches.length === 0 ? (
                        <div style={{ color: '#64748b', textAlign: 'center', width: '100%' }}>No active wars. Start one!</div>
                    ) : matches.map((match) => (
                        <motion.div
                            key={match.id}
                            className="match-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="match-info">
                                <h3>{match.name}</h3>
                                <div className="match-meta">
                                    <span className={`status ${match.status.toLowerCase()}`}>{match.status}</span>
                                    <span className="players"><Users size={14} /> {match.players}/{match.maxPlayers}</span>
                                </div>
                            </div>
                            <button
                                className="join-btn"
                                onClick={() => joinMatch(match.id)}
                            >
                                <Play size={16} /> {match.status === 'WAITING' ? 'JOIN' : 'JOIN LIVE'}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Lobby;
