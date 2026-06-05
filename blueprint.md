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

## Current Action Plan (Phase 3: Faction Destiny)
1. [ ] **Faction Page:** Implement a full-screen detailed view for individual factions.
2. [ ] **Historical Impact System:** Track player choices and their effects on faction history.
3. [ ] **Dilemma System:** Procedurally generate choices (Quest/Decision) that grant or cost Essence Points.
4. [ ] **Economic Depth:** Add more granular resource management and trade impact.

## Implementation Details (New)
### Faction Page Layout
- **State Overview:** Real-time stats with visual progress bars.
- **The Chronicle:** A list of "Historical Echoes" (Events triggered or influenced by the player).
- **Watcher's Path:** 3 active choices that refresh periodically.

### Point Economy
- **Earning:** Helping a faction survive a disaster or making a wise long-term decision.
- **Spending:** Using power to force an outcome or grant massive bonuses.
