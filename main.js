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
        
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();
        this.createGrid();
        
        window.addEventListener('resize', () => this.onWindowResize());
        this.startLoop();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(GRID_SIZE / 2, 400, GRID_SIZE * 1.5);
        this.camera.lookAt(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Optimization for 10k tiles
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
        this.controls.maxDistance = 1000;
    }

    createGrid() {
        // Using InstancedMesh for performance with 100x100 tiles
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
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
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
                
                let color;
                if (tile.ownerId !== null) {
                    color = this.sim.state.factions[tile.ownerId].color;
                } else {
                    color = new THREE.Color(tile.terrain.color);
                }
                
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
        }
        this.instancedMesh.geometry.attributes.color.needsUpdate = true;
    }

    updateUI() {
        document.getElementById('world-year').innerText = this.sim.state.tickCount;
        document.getElementById('essence-points').innerText = this.sim.state.player.influencePoints;
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
            this.updateUI();
        }, 1000); // 1 Tick per second
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

new WorldRenderer();
