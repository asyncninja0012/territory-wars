const { v4: uuidv4 } = require('uuid');
const GameRoom = require('./GameRoom');

class LobbyManager {
    constructor(io) {
        this.io = io;
        this.matches = new Map(); // matchId -> Match Object (Lobby Info)
        this.rooms = new Map();   // matchId -> GameRoom Instance
    }

    createMatch(hostId, name, config) {
        const matchId = uuidv4();
        const match = {
            id: matchId,
            name: name || `Warzone ${matchId.slice(0, 4)}`,
            hostId,
            players: new Set([hostId]),
            maxPlayers: config.maxPlayers || 10,
            mapSize: config.mapSize || 'MEDIUM',
            status: 'WAITING',
            createdAt: Date.now()
        };

        this.matches.set(matchId, match);
        this.broadcastLobbyUpdate();
        return match;
    }

    joinMatch(matchId, userId) {
        const match = this.matches.get(matchId);
        if (!match) return { error: 'Match not found' };

        // For simplicity, auto-start if 2 players join (or check min players)
        // Or just let them join a running game
        if (match.status === 'FINISHED') return { error: 'Match finished' };

        // Check for graceful deletion timeout
        if (match.deletionTimeout) {
            console.log(`Match ${matchId} saved from deletion!`);
            clearTimeout(match.deletionTimeout);
            match.deletionTimeout = null;
        }

        if (!match.players.has(userId)) {
            if (match.players.size >= match.maxPlayers) return { error: 'Match full' };
            match.players.add(userId);
            this.broadcastLobbyUpdate();
        }

        // Initialize Room if not exists
        let room = this.rooms.get(matchId);
        if (!room) {
            room = new GameRoom(this.io, matchId, { ...match });
            this.rooms.set(matchId, room);
            room.startGame();
            match.status = 'IN_PROGRESS';
            this.broadcastLobbyUpdate(); // Status Changed
        }

        return { match, room };
    }

    // Call this when a user connects to the *game namespace* or event
    // Actually, we'll handle game events in index.js by looking up the room
    getRoom(matchId) {
        return this.rooms.get(matchId);
    }

    leaveMatch(matchId, userId) {
        const match = this.matches.get(matchId);
        if (!match) return;

        match.players.delete(userId);
        if (match.players.size === 0) {
            // Grace period: Wait 10 seconds before deleting empty match
            // This allows host to refresh or reconnect without losing the match immediately
            console.log(`Match ${matchId} is empty. Scheduling deletion in 10s...`);

            match.deletionTimeout = setTimeout(() => {
                if (this.matches.has(matchId) && this.matches.get(matchId).players.size === 0) {
                    console.log(`Deleting empty match ${matchId}`);
                    this.matches.delete(matchId);
                    if (this.rooms.has(matchId)) {
                        this.rooms.get(matchId).endGame();
                        this.rooms.delete(matchId);
                    }
                    this.broadcastLobbyUpdate();
                }
            }, 10000);
        }
        this.broadcastLobbyUpdate();
    }

    getPublicMatches() {
        return Array.from(this.matches.values()).map(m => ({
            id: m.id,
            name: m.name,
            players: m.players.size,
            maxPlayers: m.maxPlayers,
            status: m.status
        }));
    }

    broadcastLobbyUpdate() {
        this.io.to('lobby').emit('lobby_update', this.getPublicMatches());
    }
}

module.exports = LobbyManager;
