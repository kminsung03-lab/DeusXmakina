import * as THREE from 'three';
import { WorldState, GRID_SIZE, TERRAIN_TYPES, FACTION_TYPES, RACES, Faction } from './engine.js';

export class SimulationManager {
    constructor() {
        this.state = new WorldState();
        this.generateWorld();
        this.spawnFactions();
    }

    generateWorld() {
        this.fillContinent(25, 50, 1);
        this.fillContinent(75, 50, 2);

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
                    
                    tile.resources.amount = 5 + Math.random() * 10;
                    tile.resources.type = tile.terrain.resources[Math.floor(Math.random() * tile.terrain.resources.length)];
                }
            }
        }
    }

    fillContinent(centerX, centerY, id) {
        const queue = [[centerX, centerY]];
        const visited = new Set();
        let count = 0;
        const target = (GRID_SIZE * GRID_SIZE) * 0.35;

        while (queue.length > 0 && count < target) {
            const [x, y] = queue.shift();
            const key = `${x},${y}`;
            if (visited.has(key) || x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;

            visited.add(key);
            this.state.grid[x][y].continentId = id;
            count++;

            const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
            neighbors.sort(() => Math.random() - 0.5);
            queue.push(...neighbors);
        }
    }

    spawnFactions() {
        const names = ["Valoria", "Xylos", "Gromm", "Ironfoot", "Thalassa", "Aethel", "Korg", "Sylva", "Blight", "Oasis"];
        for (let i = 0; i < 8; i++) {
            const faction = new Faction(i, names[i], FACTION_TYPES[i % 3], RACES[i % 5]);
            faction.color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
            
            let placed = false;
            while (!placed) {
                const rx = Math.floor(Math.random() * GRID_SIZE);
                const ry = Math.floor(Math.random() * GRID_SIZE);
                if (this.state.grid[rx][ry].continentId && !this.state.grid[rx][ry].ownerId) {
                    this.state.grid[rx][ry].ownerId = i;
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
            this.updateResources(f);
            this.processAI(f);
        });

        this.processGlobalEvents();
    }

    updateResources(f) {
        let incomeFood = 0;
        let incomeMaterials = 0;
        let incomeGold = 0;

        f.territories.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            const tile = this.state.grid[x][y];
            if (tile.resources.type === 'Food') incomeFood += tile.resources.amount * 0.2;
            else if (tile.resources.type === 'Wood' || tile.resources.type === 'Metal') incomeMaterials += tile.resources.amount * 0.15;
            else if (tile.resources.type === 'Gold') incomeGold += tile.resources.amount * 0.3;
        });

        f.food += incomeFood - (f.military * 0.1);
        f.materials += incomeMaterials;
        f.treasury += incomeGold + (f.territories.size * 0.05);

        // Survival check
        if (f.food < 0) {
            f.food = 0;
            f.stability -= 5;
            f.military -= 1;
        }
    }

    processAI(f) {
        // Priority 1: Survival
        if (f.food < 20) {
            this.actionSurvival(f);
            return;
        }

        // Priority 2: Stability
        if (f.stability < 60) {
            this.actionStabilize(f);
            return;
        }

        // Priority 3: Growth & Expansion
        const rand = Math.random();
        if (rand < 0.4) this.actionExpand(f);
        else if (rand < 0.7) this.actionDevelop(f);
        else this.actionDiplomacy(f);
    }

    actionSurvival(f) {
        f.treasury -= 10;
        f.food += 20; // Buying food
    }

    actionStabilize(f) {
        f.treasury -= 20;
        f.stability += 15;
    }

    actionExpand(f) {
        if (f.military < 20) {
            f.military += 5;
            f.materials -= 10;
            return;
        }

        const territories = Array.from(f.territories);
        const randomTileKey = territories[Math.floor(Math.random() * territories.length)];
        const [tx, ty] = randomTileKey.split(',').map(Number);
        
        const neighbors = [[tx+1, ty], [tx-1, ty], [tx, ty+1], [tx, ty-1]];
        for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const target = this.state.grid[nx][ny];
                if (target.continentId) {
                    if (target.ownerId === null) {
                        target.ownerId = f.id;
                        f.territories.add(`${nx},${ny}`);
                        break;
                    } else if (target.ownerId !== f.id) {
                        this.resolveConflict(f, this.state.factions[target.ownerId], target);
                        break;
                    }
                }
            }
        }
    }

    actionDevelop(f) {
        if (f.materials >= 50) {
            f.materials -= 50;
            f.techLevel += 0.05;
        }
    }

    actionDiplomacy(f) {
        const target = this.state.factions[Math.floor(Math.random() * this.state.factions.length)];
        if (target.id !== f.id && target.isAlive) {
            const trust = (f.diplomacy.get(target.id)?.trust || 0) + 5;
            f.diplomacy.set(target.id, { state: trust > 50 ? 'ally' : 'neutral', trust });
        }
    }

    resolveConflict(attacker, defender, tile) {
        const aPower = attacker.military * (1 + attacker.techLevel * 0.2) * (0.8 + Math.random() * 0.4);
        const dPower = defender.military * (1 + defender.techLevel * 0.2) * (1.1); // Defender advantage
        
        if (aPower > dPower) {
            defender.territories.delete(`${tile.x},${tile.y}`);
            attacker.territories.add(`${tile.x},${tile.y}`);
            tile.ownerId = attacker.id;
            attacker.military -= 3;
            defender.military -= 5;
            defender.stability -= 2;
        } else {
            attacker.military -= 10;
        }
    }

    processGlobalEvents() {
        if (Math.random() > 0.98) {
            const eventType = Math.random();
            if (eventType > 0.7) {
                // Drought / Famine
                this.state.factions.forEach(f => { f.food *= 0.8; f.stability -= 5; });
            } else if (eventType > 0.4) {
                // Economic Boom
                this.state.factions.forEach(f => { f.treasury += 100; });
            }
        }
    }

    // Player Actions
    intervene(type, targetId) {
        const f = this.state.factions[targetId];
        if (!f) return false;

        switch(type) {
            case 'info': 
                if (this.state.player.influencePoints >= 1) {
                    this.state.player.influencePoints -= 1;
                    return f; 
                }
                break;
            case 'support':
                if (this.state.player.influencePoints >= 5) {
                    this.state.player.influencePoints -= 5;
                    f.food += 100; f.treasury += 100; f.stability += 10;
                    return true;
                }
                break;
            case 'sabotage':
                if (this.state.player.influencePoints >= 8) {
                    this.state.player.influencePoints -= 8;
                    f.stability -= 30;
                    return true;
                }
                break;
            case 'grand':
                if (this.state.player.influencePoints >= 25) {
                    this.state.player.influencePoints -= 25;
                    f.military += 100; f.techLevel += 0.5;
                    return true;
                }
                break;
        }
        return false;
    }
}
