class GameRoom {
    constructor(io, matchId, match) {
        this.io = io;
        this.matchId = matchId;
        this.match = match; // Store match reference for status updates

        // Grid Setup
        this.rows = 30;
        this.cols = 30;
        this.totalBlocks = this.rows * this.cols;
        this.grid = this.initializeGrid();
        // Grid item: { id, zoneId, ownerId, color, lockedUntil }

        // Player State: userId -> { energy, color, score }
        this.players = new Map();

        // Game Loop
        this.intervalId = null;
        this.TICK_RATE = 10; // 10 ticks per second (100ms)
        this.lastTick = Date.now();
    }

    initializeGrid() {
        const grid = new Array(this.totalBlocks).fill(null);
        // Simple 3x3 Zones (Total 9 zones for 30x30 grid -> each zone 10x10)
        for (let i = 0; i < this.totalBlocks; i++) {
            const row = Math.floor(i / this.cols);
            const col = i % this.cols;

            const zoneRow = Math.floor(row / 10);
            const zoneCol = Math.floor(col / 10);
            const zoneId = `ZONE_${zoneRow}_${zoneCol}`;

            grid[i] = {
                id: i,
                zoneId: zoneId,
                ownerId: null,
                color: null,
                lockedUntil: 0
            };
        }
        return grid;
    }

    startGame() {
        console.log(`Starting match ${this.matchId}`);

        // Initialize Grid with some zones (simple implementation for now)
        // could iterate and assign zoneIds

        // Start Loop
        this.intervalId = setInterval(() => this.tick(), 1000 / this.TICK_RATE);
    }

    addPlayer(user) {
        if (!this.players.has(user.id)) {
            this.players.set(user.id, {
                id: user.id,
                username: user.username,
                color: user.color,
                energy: 100,
                score: 0,
                lastRegen: Date.now()
            });
        }
        // Broadcast full state to this player
        return {
            grid: this.grid,
            players: Array.from(this.players.values()),
            config: this.config
        };
    }

    removePlayer(userId) {
        this.players.delete(userId);
        // If empty, cleanup managed by LobbyManager
    }

    handleCapture(userId, index) {
        const player = this.players.get(userId);
        if (!player) return;
        if (index < 0 || index >= this.totalBlocks) return;
        if (player.energy < 10) return; // Cost 10 energy

        const tile = this.grid[index];
        const now = Date.now();

        // Check Lock
        if (tile && tile.lockedUntil > now) return;

        // Deduct Energy
        player.energy -= 10;

        // Capture
        // Preserve existing properties like zoneId
        this.grid[index] = {
            ...this.grid[index],
            ownerId: userId,
            color: player.color,
            lockedUntil: now + 3000, // Lock for 3s
        };
        player.score += 1;

        // Broadcast update
        this.io.to(`match:${this.matchId}`).emit('game_update', {
            type: 'capture',
            index,
            tile: this.grid[index],
            playerId: userId,
            newEnergy: player.energy,
            newScore: player.score
        });
    }

    tick() {
        const now = Date.now(); // Corrected typo from `constnow`

        // Check Win Condition (e.g., Time Limit or Domination)
        // For MVP: 5 minute timer or 80% map domination
        const GAME_DURATION = 5 * 60 * 1000; // 5 minutes
        if (now - this.match.createdAt > GAME_DURATION) {
            this.endGame('TIME_UP');
            return;
        }

        // Domination Check
        if (now % 1000 < 100) {
            const totalOwned = this.grid.filter(c => c && c.ownerId).length;
            if (totalOwned >= this.totalBlocks * 0.8) {
                this.endGame('DOMINATION');
                return;
            }
        }

        // Energy Regen (every 1s approx)
        let dirtyPlayers = [];
        for (const player of this.players.values()) {
            if (Date.now() - player.lastRegen > 1000) {
                if (player.energy < 100) {
                    player.energy = Math.min(100, player.energy + 5);
                    player.lastRegen = Date.now();
                    dirtyPlayers.push({ id: player.id, energy: player.energy });
                }
            }
        }

        if (dirtyPlayers.length > 0) {
            this.io.to(`match:${this.matchId}`).emit('game_update', {
                type: 'energy_regen',
                players: dirtyPlayers
            });
        }
    }

    endGame(reason) {
        if (this.match.status === 'FINISHED') return;

        this.match.status = 'FINISHED';
        clearInterval(this.intervalId);

        // Calculate Winner
        const sortedPlayers = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];

        this.io.to(`match:${this.matchId}`).emit('game_over', {
            reason,
            winner: winner || null,
            leaderboard: sortedPlayers
        });

        console.log(`Match ${this.matchId} ended. Winner: ${winner?.username}`);
    }

    stop() {
        clearInterval(this.intervalId);
    }
}

module.exports = GameRoom;
