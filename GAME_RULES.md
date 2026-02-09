# Territory Wars: Field Manual & Rules

## 🎯 Objective
Your goal is simple: **Conquer the Grid.**
You compete against other players in real-time to capture as much territory as possible.

### Win Conditions
1.  **Domination Victory**: Control **80%** of the entire map instantly to win.
2.  **Time Victory**: If the timer (5:00) runs out, the player with the **Highest Score** wins.

---

## 🎮 Game Mechanics

### 1. Energy System ⚡
*   Every action costs **Energy**.
*   **Max Energy**: 100
*   **Capture Cost**: 10 Energy per tile.
*   **Regeneration**: Energy restores slowly over time (**3 energy per second**). Use it wisely!
*   **Strategy**: Don't spam click! Manage your energy to defend key zones or make a burst attack.

### 2. Capturing Territory 🚩
*   **How to Capture**: Click and **HOLD** on a tile.
    *   **Normal**: **3 seconds** (Tension!).
    *   **Zone Bonus**: **0.4 seconds** (Rapid expansion).
*   **Visuals**: You will see a colored ring (matching the player color) fill up.
*   **INTERRUPTS**:
    *   If an enemy clicks a tile you are capturing, your capture is **INTERRUPTED** immediately.
    *   **Strategy**: Defend your territory by spam-clicking tiles enemies are trying to steal! blocking them resets their timer.
*   **Lockdown**: Once captured, a tile is **LOCKED**.
    *   **Normal**: **3 seconds**.
    *   **Zone Bonus**: **10 seconds** (Stronghold).

### 3. Zones & Dominance 🛡️
*   The map is divided into **9 Zones** (3x3 grid).
*   **Dominance**: If you own **> 75%** of a zone's tiles, you gain **Zone Dominance**.
*   **Bonuses**:
    1.  **Fast Capture**: You capture tiles in this zone twice as fast (0.4s).
    2.  **Strong Defense**: Any tile you capture in this zone gets a **10 second Lock** (instead of 3s), making it much harder for enemies to steal back.
    3.  **Visuals**: Your dominated zones will glow with a **Gold Border**. Enemy dominated zones will have a **Red Border**.

### 4. Special Tiles 🎲
Scattered across the map are anomaly tiles (5-10% chance). Claim them for powerful effects!
*   ⚡ **Energy Tile**: Instantly restores **100 Energy**.
*   🔒 **Fortress**: Takes **2x longer** to capture, but worth securing for defense.
*   💥 **Bomb**: **EXPLODES** upon capture! Clears a 3x3 area around it (removing enemy ownership). A tactical nuke!
*   💽 **Data Cache**: Instantly grants **+5 Score**.

---

## 🌍 World Events System
Measurements of the battlefield indicate unstable anomalies. **Every 45 seconds**, a random global event triggers, changing the tide of battle.

### Event Mechanics
*   **Trigger**: A server-side loop checks every tick. If ~45 seconds have passed since the start (or previous event), an event fires.
*   **Randomness**: The event type is chosen completely randomly (`Math.random()`) from the pool of available events.

### Event Types

#### 1. ⚡ ENERGY SURGE
*   **Effect**: **ALL players** instantly recover to **100% Energy**.
*   **Strategy**: This creates a chaotic moment where everyone can attack aggressively. Be ready to expand rapidy!

#### 2. 🔓 INSTANT UNLOCK (Security Breach)
*   **Effect**: All **Locks** on the grid are instantly removed.
*   **Strategy**: Defenses are down! Tiles that were just captured are now vulnerable immediately.

#### 3. 🤖 GRID BIAS (Sys Admin Hack)
*   **Effect**: A **random player** is chosen by the system to receive a "Glitch Boost".
*   **Bonus**: The lucky player receives **+50 Score** instantly.
*   **Why?**: War is unfair. Sometimes the system glitches in your favor.

---

## ⌨️ Controls
*   **Left Click (Hold)**: Capture Tile.
*   **UI Buttons**:
    *   **Retreat**: Leave the match (You surrender your current progress).
    *   **Lobby**: Return to finding other matches.

---

## 🏆 Scoring
*   **+1 Score** for every tile you currently own.
*   Your score fluctuates as you lose territory.
*   Defend your borders to keep your score high!
