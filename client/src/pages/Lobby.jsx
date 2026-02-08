import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Plus, Users, Play } from 'lucide-react';

const Lobby = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Mock data for now (Phase 2 will implement real fetching)
    useEffect(() => {
        setMatches([
            { id: '1', name: 'Alpha Squad War', players: 4, maxPlayers: 10, status: 'WAITING' },
            { id: '2', name: 'Midnight Raid', players: 8, maxPlayers: 10, status: 'IN_PROGRESS' },
        ]);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const joinMatch = (id) => {
        console.log(`Joining match ${id}`);
        navigate('/game');
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
                    <button className="neon-btn create-btn" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} /> Create Match
                    </button>
                </header>

                <div className="match-list">
                    {matches.map((match) => (
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
                                disabled={match.status === 'IN_PROGRESS'} // For now
                                onClick={() => joinMatch(match.id)}
                            >
                                <Play size={16} /> {match.status === 'WAITING' ? 'JOIN' : 'SPECTATE'}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Lobby;
