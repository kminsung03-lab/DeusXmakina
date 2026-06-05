export const GRID_SIZE = 100;
export const TERRAIN_TYPES = {
    PLAINS: { id: 0, name: 'Plains', color: 0x7cfc00, ratio: 0.40 },
    FOREST: { id: 1, name: 'Forest', color: 0x228b22, ratio: 0.20 },
    MOUNTAIN: { id: 2, name: 'Mountain', color: 0x808080, ratio: 0.12 },
    DESERT: { id: 3, name: 'Desert', color: 0xedc9af, ratio: 0.08 },
    SWAMP: { id: 4, name: 'Swamp', color: 0x483d8b, ratio: 0.05 },
    WATER: { id: 5, name: 'Water', color: 0x000080, ratio: 0.15 }
};

export const FACTION_TYPES = ['Kingdom', 'Empire', 'Tribe'];
export const RACES = ['Human', 'Elf', 'Orc', 'Dwarf', 'Nomad'];

export class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.terrain = TERRAIN_TYPES.WATER;
        this.continentId = null;
        this.ownerId = null;
        this.cityId = null;
        this.resource = { type: 'Food', amount: Math.random() * 10 };
    }
}

export class Faction {
    constructor(id, name, type, race) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.race = race;
        this.treasury = 200;
        this.military = 50;
        this.techLevel = 1;
        this.territories = new Set();
        this.diplomacy = new Map(); // factionId -> state
        this.isAlive = true;
    }
}

export class WorldState {
    constructor() {
        this.grid = Array.from({ length: GRID_SIZE }, (_, x) => 
            Array.from({ length: GRID_SIZE }, (_, y) => new Tile(x, y))
        );
        this.factions = [];
        this.continents = [];
        this.tickCount = 0;
        this.player = {
            influencePoints: 0,
            history: []
        };
    }
}
