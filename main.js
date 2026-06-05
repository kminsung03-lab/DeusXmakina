import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';

class WorldMap {
    constructor() {
        this.container = document.getElementById('map-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c10);
        this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.002);
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        this.continents = [];
        
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.initControls();
        this.createOcean();
        this.createContinents();
        
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        this.animate();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 180, 100);
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
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 3);
        sunLight.position.set(100, 200, 100);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);

        // Add a "rim" light for depth
        const rimLight = new THREE.PointLight(0x4cc9f0, 2, 500);
        rimLight.position.set(-150, 50, -150);
        this.scene.add(rimLight);
    }

    initControls() {
        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 30;
        this.controls.maxDistance = 600;
        this.controls.maxPolarAngle = Math.PI / 2.2;
    }

    createOcean() {
        const geometry = new THREE.PlaneGeometry(3000, 3000);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0a192f,
            shininess: 80,
            transparent: true,
            opacity: 0.85
        });
        const ocean = new THREE.Mesh(geometry, material);
        ocean.rotation.x = -Math.PI / 2;
        ocean.receiveShadow = true;
        this.scene.add(ocean);

        // Grid for scale and style
        const grid = new THREE.GridHelper(2000, 50, 0x4cc9f0, 0x1a2b3c);
        grid.position.y = 0.1;
        grid.material.opacity = 0.15;
        grid.material.transparent = true;
        this.scene.add(grid);
    }

    createContinents() {
        // Aetheria - Lush Continent (West)
        const aetheriaShape = new THREE.Shape();
        aetheriaShape.moveTo(-140, -80);
        aetheriaShape.bezierCurveTo(-180, -40, -190, 40, -120, 100);
        aetheriaShape.bezierCurveTo(-60, 120, -20, 60, -50, 0);
        aetheriaShape.bezierCurveTo(-40, -60, -100, -100, -140, -80);

        const aetheria = this.addContinentMesh(aetheriaShape, 0x1b4332, { x: -40, y: 0, z: 0 }, "Aetheria");
        this.continents.push(aetheria);

        // Umbra - Mystic Continent (East)
        const umbraShape = new THREE.Shape();
        umbraShape.moveTo(80, -100);
        umbraShape.lineTo(180, -60);
        umbraShape.lineTo(200, 20);
        umbraShape.lineTo(120, 120);
        umbraShape.lineTo(40, 60);
        umbraShape.lineTo(20, -40);
        umbraShape.closePath();

        const umbra = this.addContinentMesh(umbraShape, 0x3d2b1f, { x: 40, y: 0, z: 0 }, "Umbra");
        this.continents.push(umbra);
    }

    addContinentMesh(shape, color, position, name) {
        const extrudeSettings = {
            depth: 8,
            bevelEnabled: true,
            bevelThickness: 3,
            bevelSize: 3,
            bevelOffset: 0,
            bevelSegments: 8
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 20,
            flatShading: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(position.x, position.y + 2, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        mesh.userData = { 
            name: name, 
            baseColor: color,
            hoverColor: 0x4cc9f0 
        };
        
        this.scene.add(mesh);
        return mesh;
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
                if (this.hoveredObject) {
                    this.hoveredObject.material.color.setHex(this.hoveredObject.userData.baseColor);
                }
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
        this.renderer.render(this.scene, this.camera);
    }
}

new WorldMap();
