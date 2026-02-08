# Tech Stack Choices

We have selected a robust, modern, and performant stack to meet the requirements of a **playful, real-time web app**.

## Backend: Node.js + Express + Socket.io
- **Node.js**: The ideal runtime for real-time applications due to its event-driven, non-blocking I/O model.
- **Express**: A minimal and flexible framework to handle static assets and basic HTTP routing.
- **Socket.io**: The industry standard for real-time bidirectional communication. It handles the complexities of WebSockets (and fallbacks) and makes broadcasting events to multiple users trivial.
  - *Why not raw WebSockets?* Socket.io provides automatic reconnection, room support, and easier event namespacing which accelerates development.

## Frontend: React + Vite
- **React**: Allows us to efficiently manage the state of the grid (array of hundreds of items) and re-render only necessary components.
- **Vite**: The fastest build tool for modern web development, offering instant server start and HMR (Hot Module Replacement).
- **Vanilla CSS**: As requested, we will use pure CSS for styling. This ensures:
  - Total control over animations and transitions (critical for the "playful" feel).
  - No bloated framework dependencies.
  - We will use **CSS Variables** for theming (colors, grid size) to make it easily tweakable.

## Data Structure
- **In-Memory State**: The grid state will be stored in a simple JavaScript array in the server's memory.
  - *Rationale*: For a high-frequency game where users might be clicking rapidly, in-memory operations are the fastest. Persistence is secondary to the real-time experience for this specific prompt.

## Deployment
- The app is designed to be easily deployable to platforms like Render, Railway, or Heroku which support Node.js and persistent WebSocket connections.
