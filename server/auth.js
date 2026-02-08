const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const SECRET_KEY = 'tiles-io-super-secret-key-change-in-prod'; // separate config in real app

// Helper to generate Neon Color (reused from original logic)
const getRandomColor = () => {
    const neonColors = [
        '#ff00ff', '#00ffff', '#00ff00', '#ffff00',
        '#ff0099', '#9900ff', '#00ccff', '#ff9900',
        '#ff3333', '#ccff00'
    ];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
};

// SIGNUP
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const color = getRandomColor();

        db.run(
            `INSERT INTO users (username, password_hash, color) VALUES (?, ?, ?)`,
            [username, hash, color],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: 'Username already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }

                // Auto-login after signup
                const token = jwt.sign({ id: this.lastID, username, color }, SECRET_KEY, { expiresIn: '7d' });
                res.status(201).json({ token, user: { id: this.lastID, username, color, wins: 0 } });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// LOGIN
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, color: user.color }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, color: user.color, wins: user.wins } });
    });
});

// Middleware to verify token (exporting for use in other routes)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

module.exports = { router, authenticateToken, SECRET_KEY };
