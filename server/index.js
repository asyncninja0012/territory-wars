const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { router: authRouter, SECRET_KEY } = require('./auth');
const LobbyManager = require('./LobbyManager');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const lobbyManager = new LobbyManager(io);

// Socket Middleware for Auth
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.user = decoded; // { id, username, color }
        next();
    });
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // LOBBY EVENTS
    socket.on('join_lobby', () => {
        socket.join('lobby');
        // Send immediate update
        socket.emit('lobby_update', lobbyManager.getPublicMatches());
    });

    socket.on('create_match', ({ name, config }, callback) => {
        const match = lobbyManager.createMatch(socket.user.id, name, config);
        callback({ success: true, matchId: match.id });
    });

    socket.on('join_match', (matchId, callback) => {
        const result = lobbyManager.joinMatch(matchId, socket.user.id);
        if (result.error) {
            callback({ error: result.error });
        } else {
            socket.join(`match:${matchId}`);
            callback({ success: true, match: result.match });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.username}`);
        // Cleanup logic: remove player from matches if needed
        // For now, minimal cleanup in LobbyManager (could be improved)
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
