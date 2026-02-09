# Territory Wars: Cyberpunk Expansion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)

A real-time, browser-based multiplayer strategy game where players compete to capture territory, manage energy, and dominate the map in a neon-soaked, persistent battlefield.

## 🎮 How to Play

**[📖 READ THE OFFICIAL GAME RULES HERE](./GAME_RULES.md)**

1.  **Join the Lobby**: Create a new match or join an existing one.
2.  **Capture Territory**: Click and **HOLD** on a tile to capture it.
    *   **Interrupt**: See an enemy capturing? Click their tile to interrupt them!
3.  **Manage Energy**: Every action costs energy. Don't run dry in the middle of a battle!
4.  **Dominate Zones**: Control >75% of a zone to unlock **Super Speed Capture** and **Stronger Defenses**.
5.  **Watch for Events**: Random World Events (Energy Surges, Hacks) trigger every 45 seconds.

---

## 🚀 Installation & Setup

Follow these instructions to run the game locally on your machine.

### Prerequisites
*   Node.js (v16 or higher recommended)
*   npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/territory-wars.git
cd territory-wars
```

### 2. Install Dependencies
You need to install dependencies for both the **Client** (Frontend) and **Server** (Backend).

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd ../client
npm install
```

### 3. Start the Game
Open two separate terminal windows.

**Terminal 1 (Server):**
```bash
cd server
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 4. Play!
Open your browser and navigate to `http://localhost:5173`.
*   **Tip**: Open the game in multiple tabs (or Incognito mode) to test multiplayer features by yourself!

---

## 🛠 Tech Stack & Architecture

Territory Wars is built using a modern JavaScript stack, designed for real-time performance.

### **Frontend (Client)**
*   **React**: UI Component library.
*   **Vite**: Next-gen frontend tooling for instant dev server start.
*   **Socket.io-client**: Real-time bidirectional communication with the game server.
*   **Framer Motion**: Smooth, physics-based animations for UI and Grid interactions.
*   **React Router**: Single-page application routing.
*   **Lucide React**: Beautiful, consistent iconography.

### **Backend (Server)**
*   **Node.js & Express**: API and static file serving.
*   **Socket.io**: The core engine. Handles the "Tick Loop" (10 ticks/sec), broadcasting game state, and processing player inputs.
*   **SQLite**: Lightweight, file-based database for persisting User Accounts, Match Limits, and High Scores.
*   **JWT (JSON Web Tokens)**: Secure, stateless user authentication.

### **How it Works (The "Game Loop")**
1.  **State is Authoritative**: The Server holds the "True" state of the Grid (owners, locks, energy).
2.  **Tick System**: Every 100ms, the server runs a `tick()` function:
    *   Checks active captures (did a player hold long enough?).
    *   Regenerates player energy.
    *   Calculates Zone Dominance.
    *   Checks for Win Conditions.
3.  **Broadcast**: Relevant updates (not the whole grid every time!) are sent to clients via WebSockets (`game_update` events).
4.  **Optimistic UI**: The client visualizes actions immediately (like the capture ring), but the actual result depends on the server confirmation.

---

## 🤝 Contributing
Feel free to fork this project and submit Pull Requests!

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
