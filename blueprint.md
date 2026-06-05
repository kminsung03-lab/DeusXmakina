# Project: DeusXmakina - 100x100 Fantasy World Engine

## Overview
A complex, data-driven fantasy simulation set on a 100x100 grid map with two major continents. The world is populated by factions (Kingdoms, Empires, Tribes) and races (Humans, Elves, Orcs, Dwarfs, Nomads) that interact through expansion, war, and diplomacy.

## Architecture & Data Model
### Domain Entities
- **Map (Grid):** 100x100 Tiles. Each Tile contains terrain, continent ID, owner ID, city ID, and resources.
- **Continents:** Two major landmasses, each comprising at least 25% of the total tiles.
- **Factions:** Entities with treasury, military power, tech level, and diplomatic relations.
- **Player (Watcher):** Earns Influence Points (1 per tick) to intervene in the world.

### System Modules
- **Map Generator:** Procedural continent and terrain generation.
- **Simulation Engine:** Tick-based loop handling Faction AI, Resource growth, and Combat.
- **Event System:** Triggers natural disasters and political events based on world state.
- **Intervention API:** Handles player actions (Bless, Curse, Intervene).
- **Renderer:** Three.js-based 100x100 grid visualization with territory overlays.

## Implementation Details
### Terrain Distribution
- Plains (40%), Forest (20%), Mountains (12%), Desert (8%), Swamp (5%), Water (15%).

### Faction AI (Behavior Tree)
1. **Survival:** Prioritize food/resources if low.
2. **Stability:** Manage internal unrest.
3. **Growth:** Invest in tech and infrastructure.
4. **Expansion:** Military conquest of adjacent tiles.

### Player Interventions
- **Information (1 Pt):** Reveal hidden faction stats.
- **Support (5 Pts):** Grant resources.
- **Sabotage (8 Pts):** Increase rebellion chance.
- **Mediation (12 Pts):** Force diplomatic improvement.
- **Grand Intervention (25 Pts):** Direct combat bonus or disaster mitigation.

## Current Action Plan
1. [ ] Implement `CoreEngine.js` for data structures and simulation loop.
2. [ ] Refactor `main.js` to handle the 100x100 grid rendering.
3. [ ] Update UI with detailed faction stats and resource inventory.
4. [ ] Implement the procedural continent generator (Step 1).
