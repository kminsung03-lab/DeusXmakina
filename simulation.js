import { WorldState, GRID_SIZE, TERRAIN_TYPES, FACTION_TYPES, RACES, Faction } from './engine.js';

export class SimulationManager {
    constructor() {
        this.state = new WorldState();
        this.generateWorld();
        this.spawnFactions();
    }

    generateWorld() {
        // Simple cellular automata or random walk for 2 continents
        // Continent A (West)
        this.fillContinent(25, 50, 1);
        // Continent B (East)
        this.fillContinent(75, 50, 2);

        // Distribute terrain based on ratios
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const tile = this.state.grid[x][y];
                if (tile.continentId) {
                    const r = Math.random();
                    if (r < 0.12) tile.terrain = TERRAIN_TYPES.MOUNTAIN;
                    else if (r < 0.32) tile.terrain = TERRAIN_TYPES.FOREST;
                    else if (r < 0.72) tile.terrain = TERRAIN_TYPES.PLAINS;
                    else if (r < 0.80) tile.terrain = TERRAIN_TYPES.DESERT;
                    else tile.terrain = TERRAIN_TYPES.SWAMP;
                }
            }
        }
    }

    fillContinent(centerX, centerY, id) {
        const queue = [[centerX, centerY]];
        const visited = new Set();
        let count = 0;
        const target = (GRID_SIZE * GRID_SIZE) * 0.3; // 30% area

        while (queue.length > 0 && count < target) {
            const [x, y] = queue.shift();
            const key = `${x},${y}`;
            if (visited.has(key) || x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;

            visited.add(key);
            this.state.grid[x][y].continentId = id;
            count++;

            // Bias towards expansion
            const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
            neighbors.sort(() => Math.random() - 0.5);
            queue.push(...neighbors);
        }
    }

    spawnFactions() {
        const names = ["Valoria", "Xylos", "Gromm", "Ironfoot", "Thalassa", "Aethel", "Korg", "Sylva", "Blight", "Oasis"];
        for (let i = 0; i < 8; i++) {
            const type = FACTION_TYPES[Math.floor(Math.random() * FACTION_TYPES.length)];
            const race = RACES[Math.floor(Math.random() * RACES.length)];
            const faction = new Faction(i, names[i], type, race);
            
            // Place capital in a land tile
            let placed = false;
            while (!placed) {
                const rx = Math.floor(Math.random() * GRID_SIZE);
                const ry = Math.floor(Math.random() * GRID_SIZE);
                const tile = this.state.grid[rx][ry];
                if (tile.continentId && !tile.ownerId) {
                    tile.ownerId = i;
                    faction.territories.add(`${rx},${ry}`);
                    placed = true;
                }
            }
            this.state.factions.push(faction);
        }
    }

    tick() {
        this.state.tickCount++;
        this.state.player.influencePoints += 1;

        this.state.factions.forEach(f => {
            if (!f.isAlive) return;
            this.processAI(f);
        });

        this.processEvents();
    }

    processAI(faction) {
        // 1. Expansion
        if (Math.random() > 0.5) {
            const territories = Array.from(faction.territories);
            const randomTileKey = territories[Math.floor(Math.random() * territories.length)];
            const [tx, ty] = randomTileKey.split(',').map(Number);
            
            const neighbors = [[tx+1, ty], [tx-1, ty], [tx, ty+1], [tx, ty-1]];
            neighbors.forEach(([nx, ny]) => {
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    const target = this.state.grid[nx][ny];
                    if (target.continentId && !target.ownerId) {
                        target.ownerId = faction.id;
                        faction.territories.add(`${nx},${ny}`);
                    } else if (target.ownerId !== null && target.ownerId !== faction.id) {
                        // Potential Conflict
                        this.resolveConflict(faction, this.state.factions[target.ownerId], target);
                    }
                }
            });
        }

        // 2. Resource Management
        faction.treasury += faction.territories.size * 0.1;
        if (faction.treasury > 50) {
            faction.techLevel += 0.01;
        }
    }

    resolveConflict(attacker, defender, tile) {
        const aPower = attacker.military * (1 + attacker.techLevel * 0.1);
        const dPower = defender.military * (1 + defender.techLevel * 0.1);
        
        if (aPower > dPower * 1.2) {
            defender.territories.delete(`${tile.x},${tile.y}`);
            attacker.territories.add(`${tile.x},${tile.y}`);
            tile.ownerId = attacker.id;
            attacker.military -= 2;
            defender.military -= 5;
        }
    }

    processEvents() {
        if (Math.random() > 0.98) {
            // Trigger Random Event
            const f = this.state.factions[Math.floor(Math.random() * this.state.factions.length)];
            f.treasury -= 50; // Disaster
        }
    }
}
