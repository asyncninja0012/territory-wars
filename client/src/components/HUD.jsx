import React from 'react';
import { motion } from 'framer-motion';
import { Battery, Trophy, Clock } from 'lucide-react';

const HUD = ({ energy, score, timer, leaderboard }) => {
    return (
        <div className="hud-overlay">
            {/* Top Bar: Score & Timer */}
            <div className="hud-top">
                <div className="stat-box">
                    <Trophy className="icon gold" />
                    <span className="value">{score}</span>
                    <span className="label">TILES</span>
                </div>

                <div className="stat-box timer">
                    <Clock className="icon" />
                    <span className="value">10:00</span>
                    {/* Hardcoded timer for MVP, should come from props */}
                </div>
            </div>

            {/* Side: Leaderboard */}
            <div className="hud-sidebar">
                <h3>Top Warlords</h3>
                <ul>
                    {leaderboard.map((p, i) => (
                        <li key={p.id} style={{ borderColor: p.color }}>
                            <span className="rank">#{i + 1}</span>
                            <span className="name">{p.username}</span>
                            <span className="score">{p.score}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Bottom: Energy Bar */}
            <div className="hud-bottom">
                <div className="energy-container">
                    <div className="energy-label">
                        <Battery className={`icon ${energy < 20 ? 'low' : ''}`} />
                        <span>{Math.floor(energy)}%</span>
                        <span className="sub-label">ENERGY</span>
                    </div>
                    <div className="energy-track">
                        <motion.div
                            className="energy-fill"
                            animate={{ width: `${energy}%` }}
                            transition={{ type: 'tween', ease: 'linear', duration: 0.5 }}
                            style={{
                                backgroundColor: energy > 50 ? '#38bdf8' : energy > 20 ? '#fbbf24' : '#ef4444'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HUD;
