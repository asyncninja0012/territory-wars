# Territory Wars

A real-time multiplayer strategy game where players compete to capture territory, manage energy, and dominate the map.

## Features
- **Real-time Multiplayer**: Built with Socket.io for instant updates.
- **Strategy**: Manage energy, capture strategic zones, and lock down areas.
- **Lobby System**: Create and join custom matches.
- **Persistent Stats**: Track your wins and score (SQLite).
- **Neon Aesthetic**: Cyberpunk-inspired visual design.

## Tech Stack
- **Frontend**: React, Vite, Framer Motion, CSS Variables.
- **Backend**: Node.js, Express, Socket.io, SQLite.
- **Auth**: JWT, bcrypt.

## Getting Started

### Prerequisites
- Node.js (v14+)
- NPM

### Installation

1. **Clone the repo** (if applicable)
2. **Install Dependencies**:
   ```bash
   # Root
   npm install

   # Client
   cd client
   npm install

   # Server
   cd ../server
   npm install
   ```

### Running the Game

1. **Start the Backend**:
   ```bash
   cd server
   npm run dev
   ```
   Server runs on `http://localhost:3000`.

2. **Start the Frontend**:
   ```bash
   cd client
   npm run dev
   ```
   Client runs on `http://localhost:5173`.

3. **Play**:
   - Open the client URL.
   - Sign up / Login.
   - Create a match in the Lobby.
   - Share the URL or open another tab to join as a different user.

## Game Rules
- **Capture**: Click a grey or enemy tile to capture it (Costs 10 Energy).
- **Energy**: Regenerates over time.
- **Locking**: Captured tiles are locked for 3 seconds.
- **Winning**: Control 80% of the map OR have the highest score after 5 minutes.
