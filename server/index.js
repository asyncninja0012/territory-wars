const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Parsing JSON bodies

const { router: authRouter } = require('./auth');
app.use('/api/auth', authRouter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity
        methods: ["GET", "POST"]
    }
});

const ROW_SIZE = 30;
const COL_SIZE = 30;
const TOTAL_BLOCKS = ROW_SIZE * COL_SIZE;

// In-memory state
// Each block is either null or { color: string }
const grid = new Array(TOTAL_BLOCKS).fill(null);

// Helper to generate random neon color
const getRandomColor = () => {
    const neonColors = [
        '#ff00ff', // Magenta
        '#00ffff', // Cyan
        '#00ff00', // Lime
        '#ffff00', // Yellow
        '#ff0099', // Pink
        '#9900ff', // Purple
        '#00ccff', // Sky Blue
        '#ff9900', // Orange
        '#ff3333', // Red
        '#ccff00'  // Chartreuse
    ];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Assign a random color to this user
    const userColor = getRandomColor();
    socket.data.color = userColor;

    // Send current state to the new user
    socket.emit('init', grid, userColor);

    socket.on('capture', (index) => {
        if (index >= 0 && index < TOTAL_BLOCKS) {
            // Update grid state
            grid[index] = { color: socket.data.color };

            // Broadcast update to EVERYONE (including sender)
            io.emit('update', { index, color: socket.data.color });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
