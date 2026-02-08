# Tiles.io - Real-Time Block Capture App

A playful, real-time web application where users compete to capture blocks on a shared grid. Built with **React**, **Node.js**, and **Socket.io**.

## Features
- **Real-Time Multiplayer**: See updates instantly as other users capture blocks.
- **Interactive Grid**: 30x30 grid of captureable tiles.
- **Neon UI**: Sleek dark mode design with vibrant neon colors.
- **In-Memory State**: Fast, low-latency state management for high-frequency interaction.

## Tech Stack
- **Frontend**: React, Vite, Vanilla CSS (CSS Grid + Variables)
- **Backend**: Node.js, Express, Socket.io
- **Communication**: WebSockets (via Socket.io)

## Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- npm

### Installation

1.  **Install Backend Dependencies**
    ```bash
    npm install
    ```

2.  **Install Frontend Dependencies**
    ```bash
    cd client
    npm install
    ```

### Running the App

You need to run both the backend server and the frontend development server.

1.  **Start the Backend** (Runs on port 3000)
    ```bash
    npm start
    ```
    *Or for development with auto-restart:* `npm run dev`

2.  **Start the Frontend** (Runs on port 5173)
    Open a new terminal:
    ```bash
    cd client
    npm run dev
    ```

3.  **Play!**
    Open [http://localhost:5173](http://localhost:5173) in your browser.
    Open it in multiple tabs/windows to test real-time syncing!

## Project Structure
- **/server**: Backend logic (in `index.js`).
- **/client**: Frontend React application.
- **package.json**: Root scripts for backend.

## How It Works
- The grid state (900 blocks) is stored in the server's memory.
- When a user connects, they receive the current grid and a random neon color.
- Clicking a block emits a `capture` event to the server.
- The server updates the state and broadcasts an `update` event to **all** connected clients.
- React components optimally re-render to show the new state instantly.
