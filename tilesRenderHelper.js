import { DebugTilesRenderer as TilesRenderer, NONE} from './three/DebugTilesRenderer.js';
import { GLTFLoader } from '../three/loaders/GLTFLoader.js';
import { DRACOLoader } from '../three/loaders/DRACOLoader.js';
import Stats from '../three/libs/stats.module.js';
import { VRHelper } from './VRHelper.js';
import { FlyOrbitControls } from './FlyOrbitControls.js';

export class TileRendererHelper {
	canvas
	camera
	controls
	scene
	renderer
	tiles
	offsetParent
	statsContainer
	stats
	vrHelper
	static CAMERA_MODE = { ORBIT: 0, FLY: 1 }
	static CURRENT_CAMERA_MODE = 0

	params = {

		'enableUpdate': true,
		'raycast': NONE,
		'enableCacheDisplay': false,
		'enableRendererStats': false,
		'ionAssetId': '873271',
		'ionAccessToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkYjUzYTc4OC0yNjFmLTRlNjMtYmZiMC1hODE5Y2U0ODEzMWQiLCJpZCI6ODU0NTMsImlhdCI6MTY0NzAwMzMxNH0.YlUEWXThrWxIJoJzFPVCrb1oBqTNezU-GMCJ6mH4JZc',
		'errorTarget': 6,
		'errorThreshold': 60,
		'maxDepth': 15,
		'loadSiblings': true,
		'stopAtEmptyTiles': true,
		'displayActiveTiles': false,
		'resolutionScale': 1.0,
		'displayBoxBounds': false,
		'colorMode': 0,
		'tileStatusShow': false,
		'navControls': {}
	};

	setupTiles() {

		this.tiles.fetchOptions.mode = 'cors';

		// Note the DRACO compression files need to be supplied via an explicit source.
		// We use unpkg here but in practice should be provided by the application.
		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath('https://unpkg.com/three@0.123.0/examples/js/libs/draco/gltf/');

		const loader = new GLTFLoader(this.tiles.manager);
		loader.setDRACOLoader(dracoLoader);

		this.tiles.manager.addHandler(/\.gltf$/, loader);
		this.offsetParent.add(this.tiles.group);

	}

	reinstantiateTiles() {

		let url = '/data/3d_tile_sets/63-JX054/tileset.json';
		if (this.tiles) {

			this.offsetParent.remove(this.tiles.group);
			this.tiles.dispose();
			this.tiles = null
		}

		if (this.params.ionAssetId) {

			url = new URL(`https://api.cesium.com/v1/assets/${this.params.ionAssetId}/endpoint`);
			url.searchParams.append('access_token', this.params.ionAccessToken);

			fetch(url, { mode: 'cors' })
				.then((res) => {

					if (res.ok) {

						return res.json();

					} else {

						return Promise.reject(`${res.status} : ${res.statusText}`);

					}

				})
				.then((json) => {

					url = new URL(json.url);
					const version = url.searchParams.get('v');

					this.tiles = new TilesRenderer(url.toString());
					this.tiles.fetchOptions.headers = {};
					this.tiles.fetchOptions.headers.Authorization = `Bearer ${json.accessToken}`;

					this.tiles.preprocessURL = uri => {

						uri = new URL(uri);
						if (/^http/.test(uri.protocol)) {

							uri.searchParams.append('v', version);

						}
						return uri.toString();

					};
                    
					this.tiles.onLoadTileSet = () => {

						const box = new THREE.Box3();
						const sphere = new THREE.Sphere();
						const matrix = new THREE.Matrix4();

						let position;
						let distanceToEllipsoidCenter;

						if (this.tiles.getOrientedBounds(box, matrix)) {

							position = new THREE.Vector3().setFromMatrixPosition(matrix);
							distanceToEllipsoidCenter = position.length();

						} else if (this.tiles.getBoundingSphere(sphere)) {

							position = sphere.center.clone();
							distanceToEllipsoidCenter = position.length();

						}

						const surfaceDirection = position.normalize();
						const up = new THREE.Vector3(0, 1, 0);
						const rotationToNorthPole = this.rotationBetweenDirections(surfaceDirection, up);

						this.tiles.group.quaternion.x = rotationToNorthPole.x;
						this.tiles.group.quaternion.y = rotationToNorthPole.y;
						this.tiles.group.quaternion.z = rotationToNorthPole.z;
						this.tiles.group.quaternion.w = rotationToNorthPole.w;

						this.tiles.group.position.y = - distanceToEllipsoidCenter;
					};

					this.setupTiles();

				})
				.catch(err => {

					console.error('Unable to get ion tileset:', err);

				});

		}
		else {
			this.tiles = new TilesRenderer(url);
			this.setupTiles();
		}
	}

	rotationBetweenDirections(dir1, dir2) {

		const rotation = new THREE.Quaternion();
		const a = new THREE.Vector3().crossVectors(dir1, dir2);
		rotation.x = a.x;
		rotation.y = a.y;
		rotation.z = a.z;
		rotation.w = 1 + dir1.clone().dot(dir2);
		rotation.normalize();

		return rotation;

	}

	init(ionAssetId) {
		this.params.ionAssetId  = ionAssetId
		let _this = this
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0x33334c );
        this.canvas = document.getElementById('tile-canvas')
		// Primary camera view
		this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvas });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setClearColor(0x151c1f);
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.setAnimationLoop(this.animate.bind(this));

		// Camera
		this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
		this.scene.add(this.camera);

		// Controls
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.screenSpacePanning = false;
		this.controls.listenToKeyEvents(window);
		this.controls.minDistance = 1;
		this.controls.maxDistance = 2000;
		this.setCamera()

		// Lights
		const dirLight = new THREE.DirectionalLight(0xffffff);
		dirLight.position.set(1, 2, 3);
		this.scene.add(dirLight);

		const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
		this.scene.add(ambLight);

		this.offsetParent = new THREE.Group();
		this.scene.add(this.offsetParent);

		this.reinstantiateTiles();

		this.onWindowResize();
		window.addEventListener('resize', this.onWindowResize.bind(this), false);

		window.addEventListener('keypress', function (event) {
			if (event.key == 'f') _this.fitView()
		})
        
		document.getElementById('speedSlider').addEventListener('change', function () {
			let speed = document.getElementById('speedSlider').value;
			this.controls.panSpeed = speed;
			this.controls.keyPanSpeed = speed * 7;
			this.controls.rotateSpeed = speed;
			this.controls.zoomSpeed = speed;
		}.bind(this))

		// Stats
		this.setTileRenderStatusView()
		this.vrHelper = new VRHelper(this.scene, this.camera, this.renderer)
		this.vrHelper.init(this.onVRChangeListener.bind(this))
	}

	setTileRenderStatusView(){
		this.statsContainer = document.createElement('div');

		if(this.params.tileStatusShow){
			document.getElementById('info').appendChild(this.statsContainer);
			this.stats = new Stats();
			this.stats.showPanel(0);
			document.body.appendChild(this.stats.dom);
		}
	}

	onVRChangeListener(state, xrCamera) {
		if (state == VRHelper.VR.ENTER) {
			// remove all cameras so we can use the VR camera instead
			this.tiles.cameras.forEach(c => this.tiles.deleteCamera(c));
			this.tiles.setCamera(xrCamera);

			const leftCam = xrCamera.cameras[0];
			if (leftCam) {

				this.tiles.setResolution(xrCamera, leftCam.viewport.z, leftCam.viewport.w);

			}
		}
		else {
			this.tiles.cameras.forEach(c => this.tiles.deleteCamera(c));
			this.tiles.setCamera(this.camera);
			this.tiles.setResolutionFromRenderer(this.camera, this.renderer);
		}
	}

	onWindowResize() {
		const width = this.canvas.clientWidth;
		const height = this.canvas.clientHeight;
		this.camera.aspect = width / height;
		this.renderer.setSize(width, height, false);
		this.camera.updateProjectionMatrix();
		this.renderer.setPixelRatio(window.devicePixelRatio * this.params.resolutionScale);

	}

	fitView() {

		let tileSets = this.tiles.tileSets;
		let boundingVolumeBox = tileSets[Object.keys(tileSets)[0]].root.boundingVolume.box;
		let center = new THREE.Vector3(boundingVolumeBox[0], boundingVolumeBox[1], boundingVolumeBox[2]);
		this.controls.target = center;

		let lengthMax = Math.max(2 * boundingVolumeBox[3], 2 * boundingVolumeBox[7]);
		let fov = this.camera.fov * Math.PI / 180;
		let cameraZ = 1.1 * lengthMax / (2 * Math.tan(fov / 2));
		this.camera.position.set(center.x, center.y, center.z + cameraZ);

		let min = center.clone().sub(new THREE.Vector3(boundingVolumeBox[3], boundingVolumeBox[7], boundingVolumeBox[11]));
		let max = center.clone().add(new THREE.Vector3(boundingVolumeBox[3], boundingVolumeBox[7], boundingVolumeBox[11]));
		let size = min.distanceTo(max);
		this.camera.near = size / 1000;
		this.camera.far = size * 1000;

		this.controls.update();
	}

	animate() {

		if (!this.tiles) return;

		// update options
		this.tiles.errorTarget = this.params.errorTarget;
		this.tiles.errorThreshold = this.params.errorThreshold;
		this.tiles.loadSiblings = this.params.loadSiblings;
		this.tiles.stopAtEmptyTiles = this.params.stopAtEmptyTiles;
		this.tiles.displayActiveTiles = this.params.displayActiveTiles;
		this.tiles.maxDepth = this.params.maxDepth;
		this.tiles.displayBoxBounds = this.params.displayBoxBounds;
		this.tiles.colorMode = parseFloat(this.params.colorMode);
		this.tiles.setCamera(this.camera);
		this.tiles.setResolutionFromRenderer(this.camera, this.renderer);

		this.offsetParent.rotation.set(0, 0, 0);
		this.offsetParent.updateMatrixWorld(true);

		this.controls.update(0.01)
		// 5. calculate and display the vector values on screen
		// this copies the camera's unit vector direction to cameraDirection
		let cameraDirection = new THREE.Vector3()
		this.camera.getWorldDirection(cameraDirection)
		// scale the unit vector up to get a more intuitive value
		cameraDirection.set(cameraDirection.x * 100, cameraDirection.y * 100, cameraDirection.z * 100)

		// Update tiles
		window.tiles = this.tiles;
		if (this.params.enableUpdate) {

			this.camera.updateMatrixWorld();
			this.tiles.update();

		}

		this.render();
		if(this.stats) this.stats.update();
	}

	render() {
		this.vrHelper.renderUpdate(this.tiles)
		this.renderer.render(this.scene, this.camera);

		const cacheFullness = this.tiles.lruCache.itemList.length / this.tiles.lruCache.maxSize;
		let str = `Downloading: ${this.tiles.stats.downloading} Parsing: ${this.tiles.stats.parsing} Visible: ${this.tiles.group.children.length - 2}`;

		if (this.params.enableCacheDisplay) {

			const geomSet = new Set();
			this.tiles.traverse(tile => {

				const scene = tile.cached.scene;
				if (scene) {

					scene.traverse(c => {

						if (c.geometry) {

							geomSet.add(c.geometry);

						}

					});

				}

			});

			let count = 0;
			geomSet.forEach(g => {

				count += BufferGeometryUtils.estimateBytesUsed(g);

			});
			str += `<br/>Cache: ${(100 * cacheFullness).toFixed(2)}% ~${(count / 1000 / 1000).toFixed(2)}mb`;

		}

		if (this.params.enableRendererStats) {

			const memory = this.renderer.info.memory;
			const programCount = this.renderer.info.programs.length;
			str += `<br/>Geometries: ${memory.geometries} Textures: ${memory.textures} Programs: ${programCount}`;

		}

		if (this.statsContainer.innerHTML !== str) {
			this.statsContainer.innerHTML = str;
		}
	}

	switchCamera(mode) {
		if (mode == undefined)
		    TileRendererHelper.CURRENT_CAMERA_MODE = TileRendererHelper.CURRENT_CAMERA_MODE == 0 ? 1 : 0;
		else
		    TileRendererHelper.CURRENT_CAMERA_MODE = mode
		this.setCamera()
	}

	setCamera() {
		switch (TileRendererHelper.CURRENT_CAMERA_MODE) {

			case TileRendererHelper.CAMERA_MODE.ORBIT:
                this.controls.switchToOrbit()
				break;

			case TileRendererHelper.CAMERA_MODE.FLY:
				this.controls.switchToFly()
				break;

		}
		this.controls.update();
	}

	setNavControls(controlPanel){
		document.getElementById(controlPanel).childNodes.forEach(element => {
			switch(element.title){
				case 'Virtual reality' :
					this.vrHelper.resetButton(element)
					break;
				case 'Zoom fit' :
					element.onclick = this.fitView.bind(this)
					break;	
				case 'Orbit camera' :
					element.onclick = function(){this.switchCamera(TileRendererHelper.CAMERA_MODE.ORBIT)}.bind(this)
					break;	
				case 'Universal camera' :
					element.onclick = function(){this.switchCamera(TileRendererHelper.CAMERA_MODE.FLY)}.bind(this)
					break;				
			}
		})
	}
}
