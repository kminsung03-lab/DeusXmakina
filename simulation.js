import * as THREE from 'three';
import { WorldState, GRID_SIZE, TERRAIN_TYPES, FACTION_TYPES, RACES, Faction, City } from './engine.js';

export class SimulationManager {
    constructor() {
        this.state = new WorldState();
        this.generateWorld();
        this.spawnFactions();
    }

    generateWorld() {
        // Step 1: Initialize with Water
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                this.state.grid[x][y].continentId = null;
                this.state.grid[x][y].terrain = TERRAIN_TYPES.WATER;
            }
        }

        // Step 2: Seed continents
        this.seedLand(3, 0.45); // Create a few landmasses covering ~45% of world

        // Step 3: Cellular Automata smoothing
        this.smoothLand(3);

        // Step 4: Assign Terrains based on noise-like distribution
        this.assignTerrains();
    }

    seedLand(numSeeds, targetRatio) {
        const targetTiles = GRID_SIZE * GRID_SIZE * targetRatio;
        let currentTiles = 0;

        for (let i = 0; i < numSeeds; i++) {
            let rx = Math.floor(Math.random() * (GRID_SIZE - 20)) + 10;
            let ry = Math.floor(Math.random() * (GRID_SIZE - 20)) + 10;
            const queue = [[rx, ry]];
            const continentId = i + 1;

            while (queue.length > 0 && currentTiles < targetTiles / numSeeds * (i + 1)) {
                const [x, y] = queue.shift();
                if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
                if (this.state.grid[x][y].continentId) continue;

                this.state.grid[x][y].continentId = continentId;
                this.state.grid[x][y].terrain = TERRAIN_TYPES.PLAINS;
                currentTiles++;

                const neighbors = [[x+1, y], [x-1, y], [x, y+1], [x, y-1]];
                neighbors.sort(() => Math.random() - 0.5);
                queue.push(...neighbors);
                
                // Add some randomness to growth
                if (Math.random() > 0.7) queue.push([x + (Math.random() > 0.5 ? 2 : -2), y]);
            }
        }
    }

    smoothLand(iterations) {
        for (let i = 0; i < iterations; i++) {
            const newGrid = JSON.parse(JSON.stringify(this.state.grid.map(row => row.map(t => t.continentId))));
            for (let x = 0; x < GRID_SIZE; x++) {
                for (let y = 0; y < GRID_SIZE; y++) {
                    let landNeighbors = 0;
                    let lastId = null;
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                                if (this.state.grid[nx][ny].continentId) {
                                    landNeighbors++;
                                    lastId = this.state.grid[nx][ny].continentId;
                                }
                            }
                        }
                    }

                    if (landNeighbors >= 5) {
                        this.state.grid[x][y].continentId = lastId;
                        this.state.grid[x][y].terrain = TERRAIN_TYPES.PLAINS;
                    } else if (landNeighbors <= 2) {
                        this.state.grid[x][y].continentId = null;
                        this.state.grid[x][y].terrain = TERRAIN_TYPES.WATER;
                    }
                }
            }
        }
    }

    assignTerrains() {
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const tile = this.state.grid[x][y];
                if (!tile.continentId) continue;

                // Simple "Blobs" for different terrains using a distance-based noise approximation
                const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.random() * 0.2;
                
                if (noise > 0.6) tile.terrain = TERRAIN_TYPES.MOUNTAIN;
                else if (noise > 0.3) tile.terrain = TERRAIN_TYPES.FOREST;
                else if (noise < -0.4) tile.terrain = TERRAIN_TYPES.DESERT;
                else if (noise < -0.2) tile.terrain = TERRAIN_TYPES.SWAMP;
                else tile.terrain = TERRAIN_TYPES.PLAINS;

                tile.resources.amount = 10 + Math.random() * 20;
                tile.resources.type = tile.terrain.resources[Math.floor(Math.random() * tile.terrain.resources.length)];
            }
        }
    }

    spawnFactions() {
        const names = ["Valoria", "Xylos", "Gromm", "Ironfoot", "Thalassa", "Aethel", "Korg", "Sylva", "Blight", "Oasis"];
        for (let i = 0; i < 8; i++) {
            const faction = new Faction(i, names[i], FACTION_TYPES[i % 3], RACES[i % 5]);
            faction.color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
            
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const rx = Math.floor(Math.random() * GRID_SIZE);
                const ry = Math.floor(Math.random() * GRID_SIZE);
                if (this.state.grid[rx][ry].continentId && !this.state.grid[rx][ry].ownerId) {
                    this.state.grid[rx][ry].ownerId = i;
                    faction.territories.add(`${rx},${ry}`);
                    
                    // Create Initial Capital City
                    const city = new City(i * 100, `${faction.name} Prime`, i, rx, ry);
                    city.level = 2; // Capital starts as a City
                    this.state.grid[rx][ry].city = city;
                    
                    placed = true;
                }
                attempts++;
            }
            if (placed) this.state.factions.push(faction);
        }
    }

    tick() {
        this.state.tickCount++;
        this.state.player.influencePoints += 0.5;

        this.state.factions.forEach(f => {
            if (!f.isAlive) return;
            this.updateResources(f);
            this.updateCities(f);
            this.updateTradeRoutes(f);
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
            
            let multiplier = 1.0;
            if (tile.city) multiplier = 1.0 + (tile.city.level * 0.5); // Cities boost production

            if (tile.resources.type === 'Food') incomeFood += tile.resources.amount * 0.2 * multiplier;
            else if (tile.resources.type === 'Wood' || tile.resources.type === 'Metal') incomeMaterials += tile.resources.amount * 0.15 * multiplier;
            else if (tile.resources.type === 'Gold') incomeGold += tile.resources.amount * 0.3 * multiplier;
        });

        f.food += incomeFood - (f.military * 0.1);
        f.materials += incomeMaterials;
        f.treasury += incomeGold + (f.territories.size * 0.05);

        // Trade Route Income
        f.tradeRoutes.forEach(targetId => {
            const target = this.state.factions.find(fac => fac.id === targetId);
            if (target && target.isAlive) {
                f.treasury += 2; // Flat bonus for now
                f.stability += 0.1;
            }
        });

        if (f.food < 0) {
            f.food = 0;
            f.stability -= 2;
            f.military -= 0.5;
        }
        
        f.stability = Math.min(100, Math.max(0, f.stability));
        if (f.stability <= 0 && f.territories.size > 0) {
            f.isAlive = false;
        }
    }

    updateCities(f) {
        f.territories.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            const tile = this.state.grid[x][y];
            
            if (tile.city) {
                // City Growth
                if (f.food > 100 && tile.city.population < tile.city.level * 1000) {
                    tile.city.population += 5;
                    f.food -= 1;
                }
                
                // City Level Up
                if (tile.city.level < 3 && f.materials > 500 && tile.city.population > 500 * tile.city.level) {
                    tile.city.level++;
                    f.materials -= 500;
                    console.log(`${tile.city.name} evolved to level ${tile.city.level}!`);
                }
            } else if (f.territories.size > (f.tradeRoutes.length + 1) * 15 && f.materials > 200) {
                // Build New City if territory is large enough
                const rx = x, ry = y;
                if (!this.state.grid[rx][ry].city) {
                    const cityId = f.id * 100 + Math.floor(Math.random() * 100);
                    const city = new City(cityId, `${f.name} Outpost`, f.id, rx, ry);
                    this.state.grid[rx][ry].city = city;
                    f.materials -= 200;
                }
            }
        });
    }

    updateTradeRoutes(f) {
        // Clear old trade routes if factions are dead
        f.tradeRoutes = f.tradeRoutes.filter(id => {
            const target = this.state.factions.find(fac => fac.id === id);
            return target && target.isAlive;
        });

        if (f.tradeRoutes.length >= 3) return; // Cap trade routes

        // Find potential neighbors
        f.territories.forEach(key => {
            const [tx, ty] = key.split(',').map(Number);
            const neighbors = [[tx+1, ty], [tx-1, ty], [tx, ty+1], [tx, ty-1]];
            
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    const targetTile = this.state.grid[nx][ny];
                    if (targetTile.ownerId !== null && targetTile.ownerId !== f.id) {
                        const targetId = targetTile.ownerId;
                        const diplomacy = f.diplomacy.get(targetId);
                        
                        if (diplomacy && (diplomacy.state === 'neutral' || diplomacy.state === 'ally')) {
                            if (!f.tradeRoutes.includes(targetId)) {
                                f.tradeRoutes.push(targetId);
                                console.log(`${f.name} established trade with ${this.state.factions[targetId].name}`);
                            }
                        }
                    }
                }
            }
        });
    }

    processAI(f) {
        if (f.food < 20) {
            this.actionSurvival(f);
            return;
        }

        if (f.stability < 50) {
            this.actionStabilize(f);
            return;
        }

        const rand = Math.random();
        if (rand < 0.45) this.actionExpand(f);
        else if (rand < 0.75) this.actionDevelop(f);
        else this.actionDiplomacy(f);
    }

    actionSurvival(f) {
        if (f.treasury >= 10) {
            f.treasury -= 10;
            f.food += 20;
        }
    }

    actionStabilize(f) {
        if (f.treasury >= 20) {
            f.treasury -= 20;
            f.stability += 10;
        }
    }

    actionExpand(f) {
        if (f.military < 15 + (f.territories.size * 2)) {
            f.military += 2;
            f.materials -= 5;
            return;
        }

        const territories = Array.from(f.territories);
        if (territories.length === 0) return;
        
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
                        this.resolveConflict(f, this.state.factions.find(fac => fac.id === target.ownerId), target);
                        break;
                    }
                }
            }
        }
    }

    actionDevelop(f) {
        if (f.materials >= 40) {
            f.materials -= 40;
            f.techLevel += 0.02;
            f.military += 1;
        }
    }

    actionDiplomacy(f) {
        const target = this.state.factions[Math.floor(Math.random() * this.state.factions.length)];
        if (target && target.id !== f.id && target.isAlive) {
            const current = f.diplomacy.get(target.id) || { state: 'neutral', trust: 0 };
            current.trust += 2;
            if (current.trust > 60) current.state = 'ally';
            f.diplomacy.set(target.id, current);
        }
    }

    resolveConflict(attacker, defender, tile) {
        if (!defender) return;
        
        // Cities defend harder
        let dPowerBonus = 1.0;
        if (tile.city) dPowerBonus = 1.5 + (tile.city.level * 0.5);

        const aPower = attacker.military * (1 + attacker.techLevel * 0.1) * (0.7 + Math.random() * 0.6);
        const dPower = defender.military * (1 + defender.techLevel * 0.1) * (1.2 * dPowerBonus);
        
        if (aPower > dPower) {
            defender.territories.delete(`${tile.x},${tile.y}`);
            attacker.territories.add(`${tile.x},${tile.y}`);
            tile.ownerId = attacker.id;
            
            // City Looting / Capture
            if (tile.city) {
                attacker.treasury += tile.city.population * 0.1;
                tile.city.ownerId = attacker.id;
                tile.city.population *= 0.5; // War casualties
                tile.city.level = Math.max(1, tile.city.level - 1);
            }

            attacker.military -= 2;
            defender.military -= 4;
            defender.stability -= 5;
            if (defender.territories.size === 0) defender.isAlive = false;
        } else {
            attacker.military -= 8;
            attacker.stability -= 1;
        }
    }

    processGlobalEvents() {
        if (Math.random() > 0.99) {
            const eventType = Math.random();
            if (eventType > 0.8) {
                this.state.factions.forEach(f => { f.food *= 0.7; f.stability -= 10; });
            } else if (eventType > 0.5) {
                this.state.factions.forEach(f => { f.treasury += 50; f.military += 10; });
            }
        }
    }

    intervene(type, targetId) {
        const f = this.state.factions.find(fac => fac.id === targetId);
        if (!f || !f.isAlive) return false;

        switch(type) {
            case 'support':
                if (this.state.player.influencePoints >= 5) {
                    this.state.player.influencePoints -= 5;
                    f.food += 50; f.treasury += 50; f.stability += 15;
                    return true;
                }
                break;
            case 'sabotage':
                if (this.state.player.influencePoints >= 8) {
                    this.state.player.influencePoints -= 8;
                    f.stability -= 25;
                    return true;
                }
                break;
            case 'grand':
                if (this.state.player.influencePoints >= 25) {
                    this.state.player.influencePoints -= 25;
                    f.military += 50; f.techLevel += 0.3; f.stability += 20;
                    return true;
                }
                break;
        }
        return false;
    }
}
