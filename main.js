import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';

class WorldSimulation {
    constructor() {
        this.factions = [];
        this.essencePoints = 0;
        this.worldYear = 1240;
        this.lastTick = Date.now();
        
        this.initUI();
        this.spawnInitialFactions();
        this.startLoop();
    }

    initUI() {
        this.essenceEl = document.getElementById('essence-points');
        this.yearEl = document.getElementById('world-year');
        this.logEl = document.getElementById('event-log');
    }

    spawnInitialFactions() {
        const types = ['Empire', 'Kingdom', 'Tribe'];
        const names = [
            'Iron Reach', 'Sun Spear', 'Shadow Clan', 'Gold Hearth', 
            'Frost Bite', 'Storm Guard', 'Emerald Throne', 'Crimson Tide'
        ];

        for (let i = 0; i < 8; i++) {
            this.factions.push({
                id: i,
                name: names[i],
                type: types[Math.floor(Math.random() * types.length)],
                power: 10 + Math.random() * 20,
                territory: 1,
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
                continent: i < 4 ? 'Aetheria' : 'Umbra',
                history: []
            });
        }
    }

    addEvent(text) {
        const div = document.createElement('div');
        div.className = 'event-item';
        div.innerText = `[Year ${this.worldYear}] ${text}`;
        this.logEl.appendChild(div);
        
        // Auto-scroll logic if needed
        if (this.logEl.children.length > 50) this.logEl.removeChild(this.logEl.firstChild);
    }

    tick() {
        this.worldYear++;
        this.yearEl.innerText = this.worldYear;

        // Earn Essence
        this.essencePoints += 1;
        this.essenceEl.innerText = this.essencePoints;

        // Faction Growth
        this.factions.forEach(f => {
            if (Math.random() > 0.7) {
                f.territory += Math.random() * 0.5;
                f.power += Math.random() * 2;
                if (Math.random() > 0.95) {
                    this.addEvent(`${f.name} ${f.type} expanded their borders.`);
                }
            }
        });

        // Conflicts
        if (Math.random() > 0.9) {
            const f1 = this.factions[Math.floor(Math.random() * this.factions.length)];
            const f2 = this.factions[Math.floor(Math.random() * this.factions.length)];
            if (f1.id !== f2.id && f1.continent === f2.continent) {
                const outcome = Math.random();
                if (outcome > 0.6) {
                    this.addEvent(`War broke out between ${f1.name} and ${f2.name}!`);
                    f1.power -= 5;
                    f2.power -= 5;
                } else if (outcome > 0.3) {
                    this.addEvent(`${f1.name} and ${f2.name} signed a non-aggression pact.`);
                }
            }
        }
    }

    startLoop() {
        setInterval(() => this.tick(), 2000); // 1 Tick every 2 seconds
    }
}

class WorldMap {
    constructor() {
        this.container = document.getElementById('map-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05070a);
        this.scene.fog = new THREE.FogExp2(0x05070a, 0.0015);
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        this.continents = [];
        this.clouds = [];
        this.factionMarkers = [];
        
        this.simulation = new WorldSimulation();
        
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();
        this.createOcean();
        this.createContinents();
        this.createAtmosphere();
        this.createFactionVisuals();
        
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', () => this.onClick());
        
        this.animate();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 300, 200);
        this.camera.lookAt(0, 0, 0);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0x404040, 1.5));
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        sunLight.position.set(200, 400, 100);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
    }

    initControls() {
        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 100;
        this.controls.maxDistance = 1000;
    }

    createOcean() {
        const geo = new THREE.PlaneGeometry(5000, 5000);
        const mat = new THREE.MeshPhongMaterial({ color: 0x050a14, shininess: 100 });
        const ocean = new THREE.Mesh(geo, mat);
        ocean.rotation.x = -Math.PI / 2;
        this.scene.add(ocean);
    }

    createContinents() {
        // Simple versions for the simulation base
        const aetheriaGeo = new THREE.CylinderGeometry(200, 220, 10, 32);
        const aetheriaMat = new THREE.MeshPhongMaterial({ color: 0x1a3328 });
        const aetheria = new THREE.Mesh(aetheriaGeo, aetheriaMat);
        aetheria.position.set(-250, 5, 0);
        this.scene.add(aetheria);
        this.continents.push(aetheria);

        const umbraGeo = new THREE.CylinderGeometry(180, 200, 10, 32);
        const umbraMat = new THREE.MeshPhongMaterial({ color: 0x2d1f14 });
        const umbra = new THREE.Mesh(umbraGeo, umbraMat);
        umbra.position.set(250, 5, 0);
        this.scene.add(umbra);
        this.continents.push(umbra);
    }

    createFactionVisuals() {
        this.simulation.factions.forEach(f => {
            const geo = new THREE.SphereGeometry(10, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: f.color, emissive: f.color, emissiveIntensity: 0.5 });
            const marker = new THREE.Mesh(geo, mat);
            
            // Random position on their continent
            const contPos = f.continent === 'Aetheria' ? {x: -250, z: 0} : {x: 250, z: 0};
            marker.position.set(
                contPos.x + (Math.random() * 200 - 100),
                20,
                contPos.z + (Math.random() * 200 - 100)
            );
            
            marker.userData = { faction: f };
            this.scene.add(marker);
            this.factionMarkers.push(marker);
        });
    }

    createAtmosphere() {
        for (let i = 0; i < 30; i++) {
            const geo = new THREE.SphereGeometry(30, 8, 8);
            const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
            const cloud = new THREE.Mesh(geo, mat);
            cloud.position.set(Math.random() * 2000 - 1000, 150, Math.random() * 2000 - 1000);
            cloud.scale.set(3, 0.5, 2);
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.factionMarkers);
        
        const menu = document.getElementById('intervention-menu');
        if (intersects.length > 0) {
            const faction = intersects[0].object.userData.faction;
            document.getElementById('target-faction-name').innerText = `${faction.name} ${faction.type}`;
            menu.classList.remove('hidden');
            this.selectedFaction = faction;
        } else {
            menu.classList.add('hidden');
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        
        this.clouds.forEach(c => {
            c.position.x += 0.2;
            if (c.position.x > 1000) c.position.x = -1000;
        });

        // Pulse faction markers
        this.factionMarkers.forEach(m => {
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
            m.scale.set(scale, scale, scale);
        });

        this.renderer.render(this.scene, this.camera);
    }
}

new WorldMap();
