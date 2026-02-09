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
            socket.currentMatchId = matchId; // Track match for disconnect

            // Get Room and Player State
            const room = lobbyManager.getRoom(matchId);
            if (room) {
                const initialState = room.addPlayer(socket.user);
                callback({ success: true, match: result.match, state: initialState });
            } else {
                callback({ error: 'Game room not active' });
            }
        }
    });



    // GAME EVENTS
    socket.on('start_capture', ({ matchId, index }) => {
        try {
            const room = lobbyManager.getRoom(matchId);
            if (room && socket.user) {
                room.handleStartCapture(socket.user.id, index);
            }
        } catch (error) {
            console.error('Start Capture error:', error);
        }
    });

    socket.on('cancel_capture', ({ matchId, index }) => {
        try {
            const room = lobbyManager.getRoom(matchId);
            if (room && socket.user) {
                room.handleCancelCapture(socket.user.id, index);
            }
        } catch (error) {
            console.error('Cancel Capture error:', error);
        }
    });

    socket.on('disconnect', () => {
        const username = socket.user ? socket.user.username : 'Unknown';
        console.log(`User disconnected: ${username}`);
        if (socket.currentMatchId && socket.user) {
            lobbyManager.leaveMatch(socket.currentMatchId, socket.user.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
