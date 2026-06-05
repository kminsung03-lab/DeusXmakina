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
        this.isGameRunning = false;

        this.citySprites = new Map(); // tileKey -> Sprite
        this.tradeLines = new THREE.Group();
        this.scene.add(this.tradeLines);

        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();
        this.createGrid();
        this.updateGrid();
        this.initUI();
        this.initNavigation();
        
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', () => this.onClick());
        
        this.startLoop();
    }

    initNavigation() {
        const homeScreen = document.getElementById('home-screen');
        const gameScreen = document.getElementById('game-screen');
        
        document.getElementById('btn-start').addEventListener('click', () => {
            homeScreen.style.opacity = '0';
            setTimeout(() => {
                homeScreen.classList.add('hidden');
                gameScreen.classList.remove('hidden');
                this.isGameRunning = true;
                this.addEvent("The Watcher has ascended. Time begins now.");
                this.updateFactionList();
            }, 1000);
        });

        document.getElementById('btn-home').addEventListener('click', () => {
            gameScreen.classList.add('hidden');
            homeScreen.classList.remove('hidden');
            homeScreen.style.opacity = '1';
            this.isGameRunning = false;
        });

        const loreBtn = document.getElementById('btn-lore');
        const settingsBtn = document.getElementById('btn-settings');
        const lorePanel = document.getElementById('lore-content');
        const settingsPanel = document.getElementById('settings-content');

        loreBtn.addEventListener('click', () => lorePanel.classList.remove('hidden'));
        settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('hidden'));

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                lorePanel.classList.add('hidden');
                settingsPanel.classList.add('hidden');
            });
        });
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(GRID_SIZE / 2, 200, GRID_SIZE * 1.2);
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
        this.controls.minDistance = 20;
        this.controls.maxDistance = 1500;
        this.controls.target.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    }

    createGrid() {
        const geometry = new THREE.PlaneGeometry(0.9, 0.9);
        const material = new THREE.MeshBasicMaterial({ vertexColors: true });
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, GRID_SIZE * GRID_SIZE);
        
        const dummy = new THREE.Object3D();
        const colors = new Float32Array(GRID_SIZE * GRID_SIZE * 3);
        
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const i = x * GRID_SIZE + y;
                dummy.position.set(x, 0, y);
                dummy.rotation.x = -Math.PI / 2;
                dummy.updateMatrix();
                this.instancedMesh.setMatrixAt(i, dummy.matrix);
            }
        }
        
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.instancedMesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3));
        this.scene.add(this.instancedMesh);
    }

    updateGrid() {
        if (!this.instancedMesh) return;
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

                // Update Cities
                this.updateCityVisual(tile, x, y);
            }
        }
        this.instancedMesh.geometry.attributes.color.needsUpdate = true;
        this.updateTradeVisuals();
    }

    updateCityVisual(tile, x, y) {
        const key = `${x},${y}`;
        if (tile.city) {
            if (!this.citySprites.has(key)) {
                const canvas = document.createElement('canvas');
                canvas.width = 64; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🏛️', 32, 48);
                
                const texture = new THREE.CanvasTexture(canvas);
                const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
                const sprite = new THREE.Sprite(material);
                sprite.position.set(x, 0.5, y);
                this.scene.add(sprite);
                this.citySprites.set(key, sprite);
            }
            const sprite = this.citySprites.get(key);
            const scale = 1.0 + tile.city.level * 0.8;
            sprite.scale.set(scale, scale, 1);
        } else if (this.citySprites.has(key)) {
            const sprite = this.citySprites.get(key);
            this.scene.remove(sprite);
            this.citySprites.delete(key);
        }
    }

    updateTradeVisuals() {
        this.tradeLines.clear();
        const material = new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.3 });
        
        this.sim.state.factions.forEach(f => {
            if (!f.isAlive) return;
            const originCity = Array.from(f.territories)
                .map(key => {
                    const [x, y] = key.split(',').map(Number);
                    return this.sim.state.grid[x][y];
                })
                .find(t => t.city && t.city.level >= 2);

            if (!originCity) return;

            f.tradeRoutes.forEach(targetId => {
                const target = this.sim.state.factions.find(fac => fac.id === targetId);
                if (target && target.isAlive) {
                    const targetCity = Array.from(target.territories)
                        .map(key => {
                            const [x, y] = key.split(',').map(Number);
                            return this.sim.state.grid[x][y];
                        })
                        .find(t => t.city && t.city.level >= 2);

                    if (targetCity) {
                        const points = [
                            new THREE.Vector3(originCity.x, 0.6, originCity.y),
                            new THREE.Vector3(targetCity.x, 0.6, targetCity.y)
                        ];
                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const line = new THREE.Line(geometry, material);
                        this.tradeLines.add(line);
                    }
                }
            });
        });
    }

    updateFactionList() {
        const list = document.getElementById('faction-list');
        list.innerHTML = '';
        this.sim.state.factions.forEach(f => {
            const item = document.createElement('div');
            item.className = `faction-item ${this.selectedFactionId === f.id ? 'selected' : ''}`;
            if (!f.isAlive) item.style.opacity = '0.3';
            
            item.innerHTML = `
                <span class="name" style="color: #${f.color.getHexString()}">${f.name}</span>
                <span class="details">${f.race} ${f.type} | Territory: ${f.territories.size}</span>
                <span class="details">Trade Routes: ${f.tradeRoutes.length}</span>
            `;
            item.addEventListener('click', () => {
                this.selectedFactionId = f.id;
                this.updateFactionUI();
                this.updateFactionList();
            });
            list.appendChild(item);
        });
    }

    updateFactionUI() {
        if (this.selectedFactionId === null) {
            document.getElementById('intervention-menu').classList.add('hidden');
            return;
        }

        const f = this.sim.state.factions[this.selectedFactionId];
        document.getElementById('intervention-menu').classList.remove('hidden');
        document.getElementById('target-faction-name').innerText = f.name;
        document.getElementById('target-faction-name').style.color = `#${f.color.getHexString()}`;
        document.getElementById('target-faction-desc').innerText = `${f.race} ${f.type}`;
        
        document.getElementById('stat-military').innerText = Math.floor(f.military);
        document.getElementById('stat-stability').innerText = `${Math.floor(f.stability)}%`;
        document.getElementById('stat-treasury').innerText = Math.floor(f.treasury);
        document.getElementById('stat-tech').innerText = f.techLevel.toFixed(2);
        
        document.getElementById('res-food').innerText = Math.floor(f.food);
        document.getElementById('res-materials').innerText = Math.floor(f.materials);
    }

    initUI() {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action && this.selectedFactionId !== null) {
                    const result = this.sim.intervene(action, this.selectedFactionId);
                    if (result === true) {
                        this.addEvent(`Watcher intervened in ${this.sim.state.factions[this.selectedFactionId].name} with ${action}.`);
                        this.updateFactionUI();
                    } else {
                        alert("Not enough points!");
                    }
                }
            });
        });

        // Faction Page Transitions
        document.getElementById('btn-open-faction').addEventListener('click', () => {
            if (this.selectedFactionId !== null) {
                this.openFactionPage();
            }
        });

        document.getElementById('btn-close-faction').addEventListener('click', () => {
            this.closeFactionPage();
        });
    }

    openFactionPage() {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('faction-page').classList.remove('hidden');
        this.updateFactionPageUI();
    }

    closeFactionPage() {
        document.getElementById('faction-page').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
    }

    updateFactionPageUI() {
        const f = this.sim.state.factions.find(fac => fac.id === this.selectedFactionId);
        if (!f) return;

        document.getElementById('fp-name').innerText = f.name;
        document.getElementById('fp-name').style.color = `#${f.color.getHexString()}`;
        document.getElementById('fp-desc').innerText = `${f.race} | ${f.type}`;

        // Stats
        const statsGrid = document.getElementById('fp-stats-grid');
        statsGrid.innerHTML = `
            <div class="fp-stat-card"><span class="label">군사력</span><span class="value">${Math.floor(f.military)}</span></div>
            <div class="fp-stat-card"><span class="label">안정도</span><span class="value">${Math.floor(f.stability)}%</span></div>
            <div class="fp-stat-card"><span class="label">국고</span><span class="value">${Math.floor(f.treasury)}</span></div>
            <div class="fp-stat-card"><span class="label">기술 수준</span><span class="value">${f.techLevel.toFixed(2)}</span></div>
            <div class="fp-stat-card"><span class="label">식량</span><span class="value">${Math.floor(f.food)}</span></div>
            <div class="fp-stat-card"><span class="label">자재</span><span class="value">${Math.floor(f.materials)}</span></div>
        `;

        // History
        const historyList = document.getElementById('fp-history-list');
        historyList.innerHTML = f.history.length > 0 ? '' : '<div class="history-item">아직 기록된 역사가 없습니다.</div>';
        f.history.slice().reverse().forEach(h => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `<b>Year ${h.year}</b> ${h.text}`;
            historyList.appendChild(item);
        });

        // Dilemmas
        const dilemmaList = document.getElementById('fp-dilemma-list');
        dilemmaList.innerHTML = f.activeDilemmas.length > 0 ? '' : '<div class="dilemma-card"><p>현재 결정할 운명이 없습니다. 세계가 흐르기를 기다리십시오.</p></div>';
        f.activeDilemmas.forEach((d, dIdx) => {
            const card = document.createElement('div');
            card.className = 'dilemma-card';
            card.innerHTML = `
                <h3>${d.title}</h3>
                <p>${d.text}</p>
                <div class="dilemma-options">
                    ${d.options.map((opt, oIdx) => `
                        <button class="dilemma-opt-btn" data-didx="${dIdx}" data-oidx="${oIdx}">
                            ${opt.text}
                        </button>
                    `).join('')}
                </div>
            `;
            card.querySelectorAll('.dilemma-opt-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const dIdx = parseInt(e.target.getAttribute('data-didx'));
                    const oIdx = parseInt(e.target.getAttribute('data-oidx'));
                    if (this.sim.resolveDilemma(f.id, dIdx, oIdx)) {
                        this.updateFactionPageUI();
                    }
                });
            });
            dilemmaList.appendChild(card);
        });
    }

    addEvent(text) {
        const log = document.getElementById('event-log');
        if (!log) return;
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerText = `[Year ${this.sim.state.tickCount}] ${text}`;
        log.appendChild(item);
        if (log.children.length > 20) log.removeChild(log.firstChild);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick() {
        if (!this.isGameRunning) return;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.instancedMesh);
        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;
            const x = Math.floor(instanceId / GRID_SIZE);
            const y = instanceId % GRID_SIZE;
            const tile = this.sim.state.grid[x][y];
            
            if (tile.ownerId !== null) {
                this.selectedFactionId = tile.ownerId;
                this.updateFactionUI();
                this.updateFactionList();
            } else {
                this.selectedFactionId = null;
                this.updateFactionUI();
                this.updateFactionList();
            }
        }
    }

    startLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            if (this.isGameRunning) {
                this.controls.update();
            }
            this.renderer.render(this.scene, this.camera);
        };
        animate();

        setInterval(() => {
            if (this.isGameRunning) {
                this.sim.tick();
                this.updateGrid();
                this.updateFactionUI();
                this.updateFactionList();
                
                // Refresh Faction Page if open
                if (!document.getElementById('faction-page').classList.contains('hidden')) {
                    this.updateFactionPageUI();
                }

                document.getElementById('world-year').innerText = this.sim.state.tickCount;
                document.getElementById('essence-points').innerText = Math.floor(this.sim.state.player.influencePoints);
            }
        }, 1000);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

new WorldRenderer();
