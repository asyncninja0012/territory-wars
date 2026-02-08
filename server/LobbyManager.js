const { v4: uuidv4 } = require('uuid');

class LobbyManager {
    constructor(io) {
        this.io = io;
        this.matches = new Map(); // matchId -> Match Object
    }

    createMatch(hostId, name, config) {
        const matchId = uuidv4();
        const match = {
            id: matchId,
            name: name || `Warzone ${matchId.slice(0, 4)}`,
            hostId,
            players: new Set([hostId]), // Set of user IDs
            maxPlayers: config.maxPlayers || 10,
            mapSize: config.mapSize || 'MEDIUM', // SMALL, MEDIUM, LARGE
            status: 'WAITING', // WAITING, IN_PROGRESS, FINISHED
            createdAt: Date.now(),
            // Game state will be initialized when match starts
            gameState: null
        };

        this.matches.set(matchId, match);
        this.broadcastLobbyUpdate();
        return match;
    }

    joinMatch(matchId, userId) {
        const match = this.matches.get(matchId);
        if (!match) return { error: 'Match not found' };
        if (match.status !== 'WAITING') return { error: 'Match already in progress' };
        if (match.players.size >= match.maxPlayers) return { error: 'Match full' };
        if (match.players.has(userId)) return { error: 'Already in match' };

        match.players.add(userId);
        this.broadcastLobbyUpdate();

        // If full (or checking min players), logic here. 
        // For now, let host start manually or auto-start.
        return { match };
    }

    leaveMatch(matchId, userId) {
        const match = this.matches.get(matchId);
        if (!match) return;

        match.players.delete(userId);
        if (match.players.size === 0) {
            this.matches.delete(matchId); // Delete empty match
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
