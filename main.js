import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { SimulationManager } from './simulation.js';
import { GRID_SIZE } from './engine.js';

class WorldRenderer {
    constructor() {
        this.container = document.getElementById('map-container');
        this.sim = new SimulationManager();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05070a);
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedFactionId = null;

        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();
        this.createGrid();
        this.initUI();
        
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', () => this.onClick());
        
        this.startLoop();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(GRID_SIZE / 2, 400, GRID_SIZE * 1.5);
        this.camera.lookAt(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    }

    initControls() {
        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 1500;
    }

    createGrid() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ vertexColors: true });
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, GRID_SIZE * GRID_SIZE);
        
        const dummy = new THREE.Object3D();
        const colors = new Float32Array(GRID_SIZE * GRID_SIZE * 3);
        
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const i = x * GRID_SIZE + y;
                const tile = this.sim.state.grid[x][y];
                dummy.position.set(x, 0, y);
                dummy.rotation.x = -Math.PI / 2;
                dummy.updateMatrix();
                this.instancedMesh.setMatrixAt(i, dummy.matrix);
                const color = new THREE.Color(tile.terrain.color);
                colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
            }
        }
        this.instancedMesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3));
        this.scene.add(this.instancedMesh);
    }

    updateGrid() {
        const colors = this.instancedMesh.geometry.attributes.color.array;
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const i = x * GRID_SIZE + y;
                const tile = this.sim.state.grid[x][y];
                let color = (tile.ownerId !== null) ? this.sim.state.factions[tile.ownerId].color : new THREE.Color(tile.terrain.color);
                colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
            }
        }
        this.instancedMesh.geometry.attributes.color.needsUpdate = true;
    }

    initUI() {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (this.selectedFactionId !== null) {
                    const result = this.sim.intervene(action, this.selectedFactionId);
                    if (result === true) {
                        this.addEvent(`Watcher intervened in ${this.sim.state.factions[this.selectedFactionId].name} with ${action}.`);
                    } else if (typeof result === 'object') {
                        alert(`Information: ${result.name} - Power: ${result.military.toFixed(1)}, Stability: ${result.stability}%`);
                    } else {
                        alert("Not enough points!");
                    }
                }
            });
        });
    }

    addEvent(text) {
        const log = document.getElementById('event-log');
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerText = `[Year ${this.sim.state.tickCount}] ${text}`;
        log.appendChild(item);
        if (log.children.length > 20) log.removeChild(log.firstChild);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.innerHeight / window.innerHeight) * 2 + 1;
    }

    onClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.instancedMesh);
        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            const x = Math.floor(instanceId / GRID_SIZE);
            const y = instanceId % GRID_SIZE;
            const tile = this.sim.state.grid[x][y];
            
            if (tile.ownerId !== null) {
                this.selectedFactionId = tile.ownerId;
                const faction = this.sim.state.factions[tile.ownerId];
                document.getElementById('target-faction-name').innerText = `${faction.name} (${faction.race} ${faction.type})`;
                document.getElementById('intervention-menu').classList.remove('hidden');
            } else {
                document.getElementById('intervention-menu').classList.add('hidden');
                this.selectedFactionId = null;
            }
        }
    }

    startLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();

        setInterval(() => {
            this.sim.tick();
            this.updateGrid();
            document.getElementById('world-year').innerText = this.sim.state.tickCount;
            document.getElementById('essence-points').innerText = this.sim.state.player.influencePoints;
        }, 1000);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

new WorldRenderer();
