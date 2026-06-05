# Project: DeusXmakina - The Twin Continents Map

## Overview
A dynamic, high-fidelity fantasy world simulation. Two continents, Aetheria and Umbra, are home to numerous factions (Kingdoms, Empires, Tribes) that evolve, expand, and clash based on a procedural simulation engine. The player acts as a "Watcher," observing the world and spending accumulated points to intervene in the course of history.

## Core Systems
1.  **Faction Simulation:**
    - **Expansion:** Factions grow their territory randomly over time.
    - **Conflict:** Overlapping borders trigger Wars, Diplomacy, or Trade events.
    - **Factions:** Diverse types (Empires: high power, Kingdoms: balanced, Tribes: rapid expansion).
2.  **Player Economy (The Watcher's Influence):**
    - **Point Generation:** 1 Point earned every 10 seconds of active browsing.
    - **Intervention:** Spend points to:
        - *Bless:* Boost a faction's expansion/defense.
        - *Curse:* Weaken a faction or trigger internal strife.
        - *Peace:* Force an end to a war.
3.  **Visual Feedback:**
    - Dynamic "Territory Glow" showing faction borders.
    - Event Log (News Feed) showing the history of the world.
    - Floating icons for active wars or major diplomatic breakthroughs.

## Technical Plan
1.  **World Manager:** [In Progress] A JavaScript class to handle the simulation tick, faction logic, and point accumulation.
2.  **UI Overhaul:** [In Progress] Add a dashboard for the player's points and a scrolling event log.
3.  **Interaction Layer:** [Planned] Raycasting to select factions and open an "Intervention Menu."

## Current Action Plan
1.  [ ] Create `SimulationEngine.js` to manage factions and world events.
2.  [ ] Update `index.html` with the "Watcher Dashboard" and "Chronicle" (Event Log).
3.  [ ] Implement territory visualization on the 3D map.
4.  [ ] Add the point accumulation and intervention logic.
