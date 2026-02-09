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

        // Active Captures: tileIndex -> { playerId, startTime, duration }
        this.activeCaptures = new Map();

        // Game Loop
        this.intervalId = null;
        this.TICK_RATE = 10; // 10 ticks per second (100ms)
        this.lastTick = Date.now();
    }

    initializeGrid() {
        const grid = new Array(this.totalBlocks).fill(null);
        // Simple 3x3 Zones (Total 9 zones for 30x30 grid -> each zone 10x10)

        const SPECIAL_TYPES = ['ENERGY', 'FORTRESS', 'BOMB', 'DATA'];

        for (let i = 0; i < this.totalBlocks; i++) {
            const row = Math.floor(i / this.cols);
            const col = i % this.cols;

            const zoneRow = Math.floor(row / 10);
            const zoneCol = Math.floor(col / 10);
            const zoneId = `ZONE_${zoneRow}_${zoneCol}`;

            // 5% Chance for Special Tile
            let type = 'NORMAL';
            if (Math.random() < 0.05) {
                type = SPECIAL_TYPES[Math.floor(Math.random() * SPECIAL_TYPES.length)];
            }

            grid[i] = {
                id: i,
                zoneId: zoneId,
                type: type, // NORMAL, ENERGY, FORTRESS, BOMB, DATA
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
        // Unique Color Assignment
        const NEON_COLORS = [
            '#FF00FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000',
            '#FF1493', '#00BFFF', '#7CFC00', '#FF4500', '#9400D3',
            '#FF69B4', '#ADFF2F', '#1E90FF', '#FFD700', '#DC143C'
        ];

        let color = user.color; // Default fall back

        if (!this.players.has(user.id)) {
            const usedColors = new Set(Array.from(this.players.values()).map(p => p.color));
            const available = NEON_COLORS.filter(c => !usedColors.has(c));

            if (available.length > 0) {
                color = available[Math.floor(Math.random() * available.length)];
            } else {
                // Determine random if all taken
                color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
            }

            this.players.set(user.id, {
                id: user.id,
                username: user.username,
                color: color,
                energy: 100,
                score: 0,
                lastRegen: Date.now()
            });
        }

        // Broadcast full state
        return {
            grid: this.grid,
            players: Array.from(this.players.values()),
            config: this.config
        };
    }

    handleStartCapture(userId, index) {
        const player = this.players.get(userId);
        if (!player) return;

        // Check Energy
        if (player.energy < 10) return; // Client should also check, but server is authority

        // Check if Tile is Locked
        const tile = this.grid[index];
        if (tile.lockedUntil > Date.now()) return;

        // Check if already owned by same player (optional: allow re-capture to refresh lock?)
        // if (tile.ownerId === userId) return; 

        const now = Date.now();

        // Check Existing Capture (Interrupt Logic)
        if (this.activeCaptures.has(index)) {
            const currentCapture = this.activeCaptures.get(index);
            if (currentCapture.playerId !== userId) {
                // INTERRUPT ENEMY!
                this.activeCaptures.delete(index);
                this.io.to(`match:${this.matchId}`).emit('game_update', {
                    type: 'capture_interrupted',
                    index,
                    interrupterId: userId,
                    victimId: currentCapture.playerId
                });
                return;
            } else {
                // Already capturing, ignore
                return;
            }
        }

        // Calculate Duration
        // Base 800ms. Zone Dominator 400ms.
        const isDominator = this.zoneDominators && this.zoneDominators[tile.zoneId] === userId;
        const duration = isDominator ? 400 : 800;

        this.activeCaptures.set(index, {
            playerId: userId,
            startTime: now,
            duration
        });

        this.io.to(`match:${this.matchId}`).emit('game_update', {
            type: 'capture_started',
            index,
            playerId: userId,
            duration
        });
    }

    handleCancelCapture(userId, index) {
        if (this.activeCaptures.has(index)) {
            const capture = this.activeCaptures.get(index);
            if (capture.playerId === userId) {
                this.activeCaptures.delete(index);
                this.io.to(`match:${this.matchId}`).emit('game_update', {
                    type: 'capture_canceled',
                    index,
                    playerId: userId
                });
            }
        }
    }

    handleCaptureSuccess(userId, index) {
        const player = this.players.get(userId);
        if (!player) return;
        // Re-check energy (in case drained during capture?)
        if (player.energy < 10) return;

        const tile = this.grid[index];
        const now = Date.now();

        // 10 Energy Cost
        player.energy -= 10;

        // Check Zone Bonus (Lock Duration)
        const isDominator = this.zoneDominators && this.zoneDominators[tile.zoneId] === userId;
        const lockDuration = isDominator ? 10000 : 3000;

        // Apply Special Tile Effects
        let effectMessage = null;
        if (tile.type === 'ENERGY') {
            player.energy = 100;
            effectMessage = 'ENERGY RESTORED!';
        } else if (tile.type === 'DATA') {
            player.score += 5; // Bonus Score
            effectMessage = 'DATA SECURED (+5)';
        } else if (tile.type === 'BOMB') {
            // Bomb Logic: Reset 3x3 grid around center
            const row = Math.floor(index / this.cols);
            const col = index % this.cols;

            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        const neighborIdx = r * this.cols + c;
                        // Don't reset the bomb tile itself immediately (it gets captured below), 
                        // actually, bomb should probably destroy itself too or stay as captured?
                        // Let's say bomb explodes and leaves a crater (unowned)
                        // But for simplicity, let's claim the bomb tile but destroy neighbors.
                        if (neighborIdx !== index) {
                            const neighbor = this.grid[neighborIdx];
                            if (neighbor.lockedUntil < now) { // Only blow up if not locked
                                this.grid[neighborIdx] = { ...neighbor, ownerId: null, color: null };
                            }
                        }
                    }
                }
            }
            effectMessage = 'BOMB DETONATED!';
        }

        this.grid[index] = {
            ...this.grid[index],
            ownerId: userId,
            color: player.color,
            lockedUntil: now + lockDuration,
            type: 'NORMAL' // Consumed after capture? Or persistent? Let's consume it.
        };
        player.score += 1;

        // Broadcast active capture removal just in case
        this.activeCaptures.delete(index);

        this.io.to(`match:${this.matchId}`).emit('game_update', {
            type: 'capture_complete',
            index,
            tile: this.grid[index],
            playerId: userId,
            newEnergy: player.energy,
            newScore: player.score,
            isBonus: isDominator,
            effect: effectMessage,
            grid: tile.type === 'BOMB' ? this.grid : undefined // Send full grid if bomb to sync craters
        });
    }

    tick() {
        const now = Date.now(); // Corrected typo from `constnow`

        // Check Active Captures
        for (const [index, capture] of this.activeCaptures.entries()) {
            if (now - capture.startTime >= capture.duration) {
                // SUCCESS!
                this.handleCaptureSuccess(capture.playerId, index);
                this.activeCaptures.delete(index);
            }
        }

        // Check Win Condition (e.g., Time Limit or Domination)
        // For MVP: 5 minute timer or 80% map domination
        const GAME_DURATION = 5 * 60 * 1000; // 5 minutes
        if (now - this.match.createdAt > GAME_DURATION) {
            this.endGame('TIME_UP');
            return;
        }

        // Zone Dominance Check (every 1s)
        if (now % 1000 < 100) {
            this.updateZoneDominance();
        }

        // Energy Regen (every 1s approx)
        let dirtyPlayers = [];
        for (const player of this.players.values()) {
            if (Date.now() - player.lastRegen > 1000) {
                if (player.energy < 100) {
                    player.energy = Math.min(100, player.energy + 3); // Slower Regen (5 -> 3)
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

    updateZoneDominance() {
        const zones = {}; // zoneId -> { ownerId: count, total: count }

        // Tally
        for (const tile of this.grid) {
            if (!zones[tile.zoneId]) zones[tile.zoneId] = { total: 0, counts: {} };
            zones[tile.zoneId].total++;
            if (tile.ownerId) {
                zones[tile.zoneId].counts[tile.ownerId] = (zones[tile.zoneId].counts[tile.ownerId] || 0) + 1;
            }
        }

        // Determine Dominators (>75%)
        const dominations = {}; // zoneId -> ownerId
        for (const [zoneId, data] of Object.entries(zones)) {
            for (const [ownerId, count] of Object.entries(data.counts)) {
                if (count >= data.total * 0.75) {
                    dominations[zoneId] = ownerId;
                }
            }
        }

        this.zoneDominators = dominations;
        // Optional: Broadcast if changed, or just send with gamestate?
        // Let's send in 'game_update' periodically or on change.
        // For MVP, send every few seconds or piggback?
        // Let's emit a specific update 
        this.io.to(`match:${this.matchId}`).emit('game_update', {
            type: 'zone_update',
            zones: dominations
        });
    }

    triggerRandomEvent() {
        const events = ['ENERGY_SURGE', 'GRID_BIAS', 'INSTANT_UNLOCK'];
        const type = events[Math.floor(Math.random() * events.length)];

        let message = '';

        switch (type) {
            case 'ENERGY_SURGE':
                message = 'ENERGY SURGE! All players restored to 100% Energy.';
                for (const player of this.players.values()) {
                    player.energy = 100;
                }
                // Broadcast immediate energy update
                const allPlayers = Array.from(this.players.values()).map(p => ({ id: p.id, energy: 100 }));
                this.io.to(`match:${this.matchId}`).emit('game_update', { type: 'energy_regen', players: allPlayers });
                break;

            case 'GRID_BIAS': // Give random player a boost
                const playerIds = Array.from(this.players.keys());
                if (playerIds.length > 0) {
                    const luckyId = playerIds[Math.floor(Math.random() * playerIds.length)];
                    const luckyName = this.players.get(luckyId).username;
                    message = `SYS_ADMIN_HACK: ${luckyName} gained 50 Score!`;

                    const p = this.players.get(luckyId);
                    p.score += 50;

                    this.io.to(`match:${this.matchId}`).emit('game_update', {
                        type: 'capture', // Reuse capture update to sync score logic if efficient, but better to have explicit score update
                        // Actually, let's just emit a generic score update or reuse capture for now with dummy index? 
                        // Better: emit 'player_update'
                        playerId: luckyId,
                        index: -1,
                        tile: null,
                        newScore: p.score,
                        newEnergy: p.energy
                    });
                }
                break;

            case 'INSTANT_UNLOCK':
                message = 'SECURITY BREACH: All tiles unlocked!';
                for (let i = 0; i < this.totalBlocks; i++) {
                    if (this.grid[i]) this.grid[i].lockedUntil = 0;
                }
                // Full grid sync needed? Or just notify client to visually unlock?
                // Sending full grid state is heavy. Let's just send event and client force refresh?
                // Or update specific tiles? For MVP, let's just emit grid_update
                this.io.to(`match:${this.matchId}`).emit('game_update', { type: 'full_grid', grid: this.grid });
                break;
        }

        this.io.to(`match:${this.matchId}`).emit('game_event', { type, message });
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
