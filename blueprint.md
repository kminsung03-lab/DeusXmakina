# Project: DeusXmakina - 100x100 Fantasy World Engine

## Overview
A complex, data-driven fantasy simulation set on a 100x100 grid map with two major continents. The world is populated by factions (Kingdoms, Empires, Tribes) and races (Humans, Elves, Orcs, Dwarfs, Nomads) that interact through expansion, war, and diplomacy.

## Architecture & Data Model
### Domain Entities
- **Map (Grid):** 100x100 Tiles. Each Tile contains terrain, continent ID, owner ID, city ID, and resources.
- **Continents:** Multiple procedurally generated landmasses.
- **Factions:** Entities with treasury, military power, tech level, and diplomatic relations.
- **Player (Watcher):** Earns Influence Points to intervene in the world.

### System Modules
- **Map Generator:** Seed-based growth with Cellular Automata smoothing.
- **Simulation Engine:** Tick-based loop handling Faction AI, Resource growth, and Combat.
- **Event System:** Triggers natural disasters and political events.
- **Intervention API:** Handles player actions (Support, Sabotage, Ascend).
- **Renderer:** Three.js-based 100x100 grid visualization with InstancedMesh.

## Implementation Details
### Terrain Distribution
- Plains, Forest, Mountains, Desert, Swamp, Water.

### Faction AI (Priority-based)
1. **Survival:** Buy food if starving.
2. **Stability:** Invest in stability if low.
3. **Expansion:** Military conquest or peaceful land grab.
4. **Development:** Tech upgrades and military training.

## Current Action Plan
1. [x] Implement `CoreEngine.js` for data structures and simulation loop.
2. [x] Refactor `main.js` to handle the 100x100 grid rendering.
3. [x] Update UI with detailed faction stats and resource inventory.
4. [x] Implement the procedural continent generator (Step 1).

## Next Goals (Phase 2)
- [ ] **City System:** Factions can build cities on specific tiles to increase resource production.
- [ ] **Diplomacy UI:** Add a dedicated panel to see relations between all factions.
- [ ] **Advanced AI:** Implement trade routes and alliances.
- [ ] **Visual Polish:** Add particle effects for interventions and combat.
