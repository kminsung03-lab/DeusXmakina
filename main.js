import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';

class WorldMap {
    constructor() {
        this.container = document.getElementById('map-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c10);
        this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.0015);
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        this.continents = [];
        this.clouds = [];
        
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();
        this.createOcean();
        this.createContinents();
        this.createAtmosphere();
        
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        this.animate();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 250, 150);
        this.camera.lookAt(0, 0, 0);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    initLights() {
        this.scene.add(new THREE.AmbientLight(0x404040, 1.5));

        const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        sunLight.position.set(200, 300, 100);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.left = -500;
        sunLight.shadow.camera.right = 500;
        sunLight.shadow.camera.top = 500;
        sunLight.shadow.camera.bottom = -500;
        this.scene.add(sunLight);

        const fillLight = new THREE.PointLight(0x4cc9f0, 1, 1000);
        fillLight.position.set(-200, 100, -200);
        this.scene.add(fillLight);
    }

    initControls() {
        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 800;
        this.controls.maxPolarAngle = Math.PI / 2.1;
    }

    createOcean() {
        const geometry = new THREE.PlaneGeometry(4000, 4000, 100, 100);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0a192f,
            shininess: 90,
            transparent: true,
            opacity: 0.9
        });
        this.ocean = new THREE.Mesh(geometry, material);
        this.ocean.rotation.x = -Math.PI / 2;
        this.ocean.receiveShadow = true;
        this.scene.add(this.ocean);

        const grid = new THREE.GridHelper(3000, 60, 0x4cc9f0, 0x1a2b3c);
        grid.position.y = 0.2;
        grid.material.opacity = 0.1;
        grid.material.transparent = true;
        this.scene.add(grid);
    }

    createContinents() {
        // Aetheria (West)
        const aetheriaShape = new THREE.Shape();
        aetheriaShape.moveTo(-150, -100);
        aetheriaShape.bezierCurveTo(-200, -50, -220, 50, -140, 120);
        aetheriaShape.bezierCurveTo(-80, 140, -40, 80, -60, 0);
        aetheriaShape.bezierCurveTo(-50, -80, -110, -120, -150, -100);

        const aetheria = this.addContinentMesh(aetheriaShape, 0x244d3e, { x: -50, y: 0, z: 0 }, "Aetheria");
        this.continents.push(aetheria);
        this.addMountains(aetheria, 8, 0xffffff); // Silver Peaks
        this.addForests(aetheria, 15, 0x1b4332); // Whispering Woods

        // Umbra (East)
        const umbraShape = new THREE.Shape();
        umbraShape.moveTo(100, -120);
        umbraShape.lineTo(200, -80);
        umbraShape.lineTo(220, 30);
        umbraShape.lineTo(140, 140);
        umbraShape.lineTo(50, 70);
        umbraShape.lineTo(30, -50);
        umbraShape.closePath();

        const umbra = this.addContinentMesh(umbraShape, 0x3d2b1f, { x: 50, y: 0, z: 0 }, "Umbra");
        this.continents.push(umbra);
        this.addCrags(umbra, 10, 0x1a1a1a); // Obsidian Crags
        this.addDesert(umbra, 5, 0xc2a878); // Ember Desert
    }

    addContinentMesh(shape, color, position, name) {
        const extrudeSettings = { depth: 10, bevelEnabled: true, bevelThickness: 4, bevelSize: 4, bevelSegments: 8 };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshPhongMaterial({ color: color, shininess: 15 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(position.x, 2, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { name: name, baseColor: color, hoverColor: 0x4cc9f0 };
        this.scene.add(mesh);
        return mesh;
    }

    addMountains(parent, count, snowColor) {
        for (let i = 0; i < count; i++) {
            const height = 15 + Math.random() * 25;
            const radius = 5 + Math.random() * 10;
            const geo = new THREE.ConeGeometry(radius, height, 4);
            const mat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a, flatShading: true });
            const mountain = new THREE.Mesh(geo, mat);
            
            // Snow cap
            const capGeo = new THREE.ConeGeometry(radius * 0.4, height * 0.4, 4);
            const capMat = new THREE.MeshPhongMaterial({ color: snowColor });
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.y = height * 0.3;
            mountain.add(cap);

            const pos = this.getRandomPointInMesh(parent);
            mountain.position.set(pos.x, height/2 + 10, pos.z);
            mountain.castShadow = true;
            this.scene.add(mountain);
        }
    }

    addCrags(parent, count, color) {
        for (let i = 0; i < count; i++) {
            const size = 5 + Math.random() * 15;
            const geo = new THREE.IcosahedronGeometry(size, 0);
            const mat = new THREE.MeshPhongMaterial({ color: color, flatShading: true });
            const crag = new THREE.Mesh(geo, mat);
            
            const pos = this.getRandomPointInMesh(parent);
            crag.position.set(pos.x, 5, pos.z);
            crag.scale.set(1, 2 + Math.random() * 2, 1);
            crag.rotation.set(Math.random(), Math.random(), Math.random());
            crag.castShadow = true;
            this.scene.add(crag);
        }
    }

    addForests(parent, count, color) {
        for (let i = 0; i < count; i++) {
            const group = new THREE.Group();
            const treeCount = 5 + Math.floor(Math.random() * 10);
            const basePos = this.getRandomPointInMesh(parent);
            
            for (let j = 0; j < treeCount; j++) {
                const h = 5 + Math.random() * 10;
                const treeGeo = new THREE.ConeGeometry(2, h, 6);
                const treeMat = new THREE.MeshPhongMaterial({ color: color });
                const tree = new THREE.Mesh(treeGeo, treeMat);
                tree.position.set(Math.random() * 20 - 10, h/2 + 10, Math.random() * 20 - 10);
                tree.castShadow = true;
                group.add(tree);
            }
            group.position.set(basePos.x, 0, basePos.z);
            this.scene.add(group);
        }
    }

    addDesert(parent, count, color) {
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(20, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const mat = new THREE.MeshPhongMaterial({ color: color });
            const dune = new THREE.Mesh(geo, mat);
            const pos = this.getRandomPointInMesh(parent);
            dune.position.set(pos.x, 10, pos.z);
            dune.scale.set(1, 0.2, 1.5);
            dune.receiveShadow = true;
            this.scene.add(dune);
        }
    }

    getRandomPointInMesh(mesh) {
        // Simple bounding box based random for demo, ideally uses shape testing
        const box = new THREE.Box3().setFromObject(mesh);
        return {
            x: box.min.x + Math.random() * (box.max.x - box.min.x),
            z: box.min.z + Math.random() * (box.max.z - box.min.z)
        };
    }

    createAtmosphere() {
        for (let i = 0; i < 20; i++) {
            const geo = new THREE.SphereGeometry(20 + Math.random() * 30, 16, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
            const cloud = new THREE.Mesh(geo, mat);
            cloud.position.set(Math.random() * 1000 - 500, 100 + Math.random() * 50, Math.random() * 1000 - 500);
            cloud.scale.set(2, 0.5, 1);
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    updateHover() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.continents);
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (this.hoveredObject !== object) {
                if (this.hoveredObject) this.hoveredObject.material.color.setHex(this.hoveredObject.userData.baseColor);
                this.hoveredObject = object;
                this.hoveredObject.material.color.setHex(this.hoveredObject.userData.hoverColor);
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (this.hoveredObject) {
                this.hoveredObject.material.color.setHex(this.hoveredObject.userData.baseColor);
                this.hoveredObject = null;
                document.body.style.cursor = 'default';
            }
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
        this.updateHover();
        
        // Animate clouds
        this.clouds.forEach(c => {
            c.position.x += 0.1;
            if (c.position.x > 600) c.position.x = -600;
        });

        // Simple wave animation
        if (this.ocean) {
            this.ocean.material.shininess = 80 + Math.sin(Date.now() * 0.001) * 10;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new WorldMap();
