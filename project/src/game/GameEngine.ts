import * as THREE from 'three';
import { World } from './World';
import { Player } from './Player';
import { BlockType, InventorySlot } from '../types/Block';
import { Inventory } from './Inventory';
import { ItemManager } from './ItemManager';
import { NPCManager } from './NPCManager';
import { NPCType } from '../types/NPC';

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: World;
  private player: Player;
  private inventory: Inventory;
  private npcManager: NPCManager;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedBlockType: BlockType = BlockType.GRASS;
  private selectedHotbarSlot: number = 0;
  private highlightMesh: THREE.Mesh;
  private clock: THREE.Clock;
  private isPointerLocked = false;
  private sensitivity = 1.0;
  private health = 20;
  private maxHealth = 20;
  private hunger = 20;
  private maxHunger = 20;
  private lastChunkUpdate = 0;
  private respawnInProgress = false;

  // UI callbacks
  private onInventoryUpdate?: (hotbar: InventorySlot[]) => void;
  private onHealthUpdate?: (health: number, maxHealth: number) => void;
  private onHungerUpdate?: (hunger: number, maxHunger: number) => void;
  private onRespawn?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    
    ItemManager.initialize();
    this.inventory = new Inventory();
    this.initializeStartingItems();
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.setupLighting();
    
    this.world = new World(this.scene);
    this.player = new Player(this.camera);
    this.npcManager = new NPCManager(this.scene);
    
    const playerMesh = this.player.getPlayerMesh();
    if (playerMesh) {
      this.scene.add(playerMesh);
    }
    
    this.spawnInitialNPCs();
    
    this.highlightMesh = this.createHighlightMesh();
    this.scene.add(this.highlightMesh);
    
    this.setupEventListeners();
    this.animate();
  }

  private initializeStartingItems() {
    const grassItem = ItemManager.getItem('grass');
    const dirtItem = ItemManager.getItem('dirt');
    const stoneItem = ItemManager.getItem('stone');
    const woodItem = ItemManager.getItem('wood');
    const leavesItem = ItemManager.getItem('leaves');
    const pickaxe = ItemManager.getItem('wooden_pickaxe');
    const sword = ItemManager.getItem('iron_sword');
    const bread = ItemManager.getItem('bread');

    if (grassItem) this.inventory.addItem(grassItem, 64);
    if (dirtItem) this.inventory.addItem(dirtItem, 64);
    if (stoneItem) this.inventory.addItem(stoneItem, 64);
    if (woodItem) this.inventory.addItem(woodItem, 64);
    if (leavesItem) this.inventory.addItem(leavesItem, 64);
    if (pickaxe) this.inventory.addItem(pickaxe, 1);
    if (sword) this.inventory.addItem(sword, 1);
    if (bread) this.inventory.addItem(bread, 10);
  }

  private spawnInitialNPCs() {
    const playerPos = this.camera.position;
    this.npcManager.spawnRandomNPCs(playerPos, 80, 10);
    
    this.npcManager.spawnNPC(NPCType.VILLAGER, new THREE.Vector3(20, 70, 20));
    this.npcManager.spawnNPC(NPCType.ZOMBIE, new THREE.Vector3(-30, 70, -30));
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
  }

  private createHighlightMesh(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    return mesh;
  }

  private setupEventListeners() {
    document.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        document.body.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === document.body;
    });

    document.addEventListener('mousemove', (event) => {
      if (!this.isPointerLocked) return;
      
      this.player.handleMouseMovement(event.movementX, event.movementY, this.sensitivity);
    });

    document.addEventListener('mousedown', (event) => {
      if (!this.isPointerLocked) return;
      
      const hit = this.world.raycast(this.raycaster);
      if (hit) {
        if (event.button === 0) { // Left click - destroy
          this.world.setBlock(hit.block.x, hit.block.y, hit.block.z, BlockType.AIR);
          const blockItem = ItemManager.getBlockItem(hit.block.type);
          if (blockItem) {
            this.inventory.addItem(blockItem, 1);
            this.updateInventoryUI();
          }
        } else if (event.button === 2) { // Right click - place
          const selectedSlot = this.inventory.getSlot(this.selectedHotbarSlot);
          if (selectedSlot?.item?.blockType) {
            this.world.setBlock(hit.face.x, hit.face.y, hit.face.z, selectedSlot.item.blockType);
            this.inventory.removeItem(this.selectedHotbarSlot, 1);
            this.updateInventoryUI();
          }
        }
      }
    });

    document.addEventListener('keydown', (event) => {
      const keyIndex = parseInt(event.key) - 1;
      if (keyIndex >= 0 && keyIndex < 9) {
        this.selectedHotbarSlot = keyIndex;
        this.updateSelectedBlock();
      }
    });

    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private updateSelectedBlock() {
    const selectedSlot = this.inventory.getSlot(this.selectedHotbarSlot);
    if (selectedSlot?.item?.blockType) {
      this.selectedBlockType = selectedSlot.item.blockType;
    }
  }

  private updateInventoryUI() {
    if (this.onInventoryUpdate) {
      this.onInventoryUpdate(this.inventory.getHotbarSlots());
    }
  }

  private checkPlayerBounds() {
    const playerPosition = this.camera.position;
    
    if (this.world.isOutOfBounds(playerPosition) || playerPosition.y < -20) {
      this.respawnPlayer();
    }
  }

  private respawnPlayer() {
    if (this.respawnInProgress) return;
    
    this.respawnInProgress = true;
    
    const spawnPoint = this.world.findSafeSpawnPoint();
    
    this.camera.position.copy(spawnPoint);
    this.player.resetVelocity();
    
    this.health = Math.max(1, this.health - 5);
    if (this.onHealthUpdate) {
      this.onHealthUpdate(this.health, this.maxHealth);
    }
    
    if (this.onRespawn) {
      this.onRespawn();
    }
    
    setTimeout(() => {
      this.respawnInProgress = false;
    }, 1000);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    const currentTime = this.clock.getElapsedTime();
    
    // Update player with improved collision detection
    this.player.update(deltaTime, (x, y, z) => {
      const blockType = this.world.getBlock(x, y, z);
      return blockType !== BlockType.AIR;
    });
    
    this.checkPlayerBounds();
    
    if (currentTime - this.lastChunkUpdate > 2) {
      this.world.updateChunks(this.camera.position);
      this.lastChunkUpdate = currentTime;
    }
    
    this.npcManager.update(deltaTime, this.camera.position);
    
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    const hit = this.world.raycast(this.raycaster);
    if (hit) {
      this.highlightMesh.position.set(hit.block.x, hit.block.y, hit.block.z);
      this.highlightMesh.visible = true;
    } else {
      this.highlightMesh.visible = false;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  setControlsEnabled(enabled: boolean) {
    this.player.setControlsEnabled(enabled);
  }

  isInThirdPerson(): boolean {
    return this.player.isInThirdPerson();
  }

  setSelectedBlock(blockType: BlockType) {
    this.selectedBlockType = blockType;
  }

  getSelectedBlock(): BlockType {
    return this.selectedBlockType;
  }

  setSensitivity(sensitivity: number) {
    this.sensitivity = sensitivity;
  }

  getSensitivity(): number {
    return this.sensitivity;
  }

  getInventory(): Inventory {
    return this.inventory;
  }

  getSelectedHotbarSlot(): number {
    return this.selectedHotbarSlot;
  }

  setSelectedHotbarSlot(slot: number) {
    if (slot >= 0 && slot < 9) {
      this.selectedHotbarSlot = slot;
      this.updateSelectedBlock();
    }
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getHunger(): number {
    return this.hunger;
  }

  getMaxHunger(): number {
    return this.maxHunger;
  }

  getWorldData(): any {
    return {
      playerPosition: this.camera.position.toArray(),
      playerRotation: [this.camera.rotation.x, this.camera.rotation.y, this.camera.rotation.z],
      inventory: this.inventory.getAllSlots(),
      health: this.health,
      hunger: this.hunger,
      isThirdPerson: this.player.isInThirdPerson(),
      worldData: this.world.getWorldData(),
      timestamp: Date.now()
    };
  }

  loadWorldData(data: any) {
    if (data.playerPosition) {
      this.camera.position.fromArray(data.playerPosition);
    }
    if (data.playerRotation) {
      this.camera.rotation.set(data.playerRotation[0], data.playerRotation[1], data.playerRotation[2]);
    }
    if (data.inventory) {
      this.inventory.clear();
      data.inventory.forEach((slot: any, index: number) => {
        if (slot.item) {
          this.inventory.addItem(slot.item, slot.quantity);
        }
      });
      this.updateInventoryUI();
    }
    if (data.health !== undefined) {
      this.health = data.health;
      if (this.onHealthUpdate) {
        this.onHealthUpdate(this.health, this.maxHealth);
      }
    }
    if (data.hunger !== undefined) {
      this.hunger = data.hunger;
      if (this.onHungerUpdate) {
        this.onHungerUpdate(this.hunger, this.maxHunger);
      }
    }
    if (data.isThirdPerson !== undefined && data.isThirdPerson !== this.player.isInThirdPerson()) {
      this.player.togglePerspective();
    }
    if (data.worldData) {
      this.world.loadWorldData(data.worldData);
    }
  }

  setInventoryUpdateCallback(callback: (hotbar: InventorySlot[]) => void) {
    this.onInventoryUpdate = callback;
    this.updateInventoryUI();
  }

  setHealthUpdateCallback(callback: (health: number, maxHealth: number) => void) {
    this.onHealthUpdate = callback;
  }

  setHungerUpdateCallback(callback: (hunger: number, maxHunger: number) => void) {
    this.onHungerUpdate = callback;
  }

  setRespawnCallback(callback: () => void) {
    this.onRespawn = callback;
  }
}