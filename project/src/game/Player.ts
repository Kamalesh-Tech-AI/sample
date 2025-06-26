import * as THREE from 'three';

export class Player {
  private camera: THREE.PerspectiveCamera;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private canJump = false;
  private isGrounded = false;
  private controlsEnabled = true;
  
  // Camera rotation
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private PI_2 = Math.PI / 2;
  
  // Third person mode
  private isThirdPerson = false;
  private cameraDistance = 5;
  private playerMesh: THREE.Group | null = null;
  private firstPersonPosition: THREE.Vector3 = new THREE.Vector3();
  private thirdPersonOffset: THREE.Vector3 = new THREE.Vector3();
  
  private readonly moveSpeed = 8; // Reduced for better control
  private readonly jumpSpeed = 8;
  private readonly gravity = -20;
  private readonly playerHeight = 1.8;
  private readonly playerWidth = 0.6;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.set(0, 70, 0);
    this.firstPersonPosition.copy(this.camera.position);
    this.setupControls();
    this.createPlayerMesh();
  }

  private createPlayerMesh() {
    this.playerMesh = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.3);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4A90E2 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    this.playerMesh.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.05;
    this.playerMesh.add(head);
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.25, 1.2, 0.25);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.425, 1.2, 0);
    this.playerMesh.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.425, 1.2, 0);
    this.playerMesh.add(rightArm);
    
    // Legs
    const legGeometry = new THREE.BoxGeometry(0.25, 1.2, 0.25);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2E5BBA });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.6, 0);
    this.playerMesh.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.6, 0);
    this.playerMesh.add(rightLeg);
    
    this.playerMesh.visible = false;
    this.updatePlayerMeshPosition();
  }

  private setupControls() {
    document.addEventListener('keydown', (event) => {
      if (!this.controlsEnabled) return;
      
      switch (event.code) {
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Space':
          if (this.canJump) {
            this.velocity.y = this.jumpSpeed;
            this.canJump = false;
          }
          break;
        case 'KeyF':
          this.togglePerspective();
          break;
      }
    });

    document.addEventListener('keyup', (event) => {
      if (!this.controlsEnabled) return;
      
      switch (event.code) {
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    });
  }

  handleMouseMovement(movementX: number, movementY: number, sensitivity: number) {
    if (!this.controlsEnabled) return;
    
    const adjustedSensitivity = sensitivity * 0.002;
    
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= movementX * adjustedSensitivity;
    this.euler.x -= movementY * adjustedSensitivity;
    this.euler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.euler.x));
    
    this.camera.quaternion.setFromEuler(this.euler);
    
    // Update player mesh rotation in third person
    if (this.isThirdPerson && this.playerMesh) {
      this.playerMesh.rotation.y = this.euler.y;
    }
  }

  togglePerspective() {
    this.isThirdPerson = !this.isThirdPerson;
    
    if (this.playerMesh) {
      this.playerMesh.visible = this.isThirdPerson;
    }
    
    if (this.isThirdPerson) {
      // Store first person position
      this.firstPersonPosition.copy(this.camera.position);
      this.updateThirdPersonCamera();
    } else {
      // Return to first person position
      this.camera.position.copy(this.firstPersonPosition);
    }
  }

  private updatePlayerMeshPosition() {
    if (!this.playerMesh) return;
    
    // Position player mesh at feet level
    this.playerMesh.position.copy(this.firstPersonPosition);
    this.playerMesh.position.y -= this.playerHeight;
    this.playerMesh.rotation.y = this.euler.y;
  }

  private updateThirdPersonCamera() {
    if (!this.isThirdPerson) return;
    
    // Calculate camera position behind and above the player
    const offset = new THREE.Vector3(0, 2, this.cameraDistance);
    offset.applyEuler(new THREE.Euler(0, this.euler.y, 0));
    
    this.camera.position.copy(this.firstPersonPosition);
    this.camera.position.add(offset);
  }

  setControlsEnabled(enabled: boolean) {
    this.controlsEnabled = enabled;
    if (!enabled) {
      this.moveForward = false;
      this.moveBackward = false;
      this.moveLeft = false;
      this.moveRight = false;
    }
  }

  resetVelocity() {
    this.velocity.set(0, 0, 0);
  }

  getPlayerMesh(): THREE.Group | null {
    return this.playerMesh;
  }

  isInThirdPerson(): boolean {
    return this.isThirdPerson;
  }

  // Enhanced collision detection
  private checkCollision(position: THREE.Vector3, checkCollision: (x: number, y: number, z: number) => boolean): boolean {
    const halfWidth = this.playerWidth / 2;
    const positions = [
      // Check corners at feet level
      new THREE.Vector3(position.x - halfWidth, position.y - this.playerHeight, position.z - halfWidth),
      new THREE.Vector3(position.x + halfWidth, position.y - this.playerHeight, position.z - halfWidth),
      new THREE.Vector3(position.x - halfWidth, position.y - this.playerHeight, position.z + halfWidth),
      new THREE.Vector3(position.x + halfWidth, position.y - this.playerHeight, position.z + halfWidth),
      // Check corners at head level
      new THREE.Vector3(position.x - halfWidth, position.y - 0.1, position.z - halfWidth),
      new THREE.Vector3(position.x + halfWidth, position.y - 0.1, position.z - halfWidth),
      new THREE.Vector3(position.x - halfWidth, position.y - 0.1, position.z + halfWidth),
      new THREE.Vector3(position.x + halfWidth, position.y - 0.1, position.z + halfWidth),
      // Check center points
      new THREE.Vector3(position.x, position.y - this.playerHeight, position.z),
      new THREE.Vector3(position.x, position.y - this.playerHeight / 2, position.z),
      new THREE.Vector3(position.x, position.y - 0.1, position.z)
    ];

    for (const pos of positions) {
      if (checkCollision(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z))) {
        return true;
      }
    }
    return false;
  }

  update(deltaTime: number, checkCollision: (x: number, y: number, z: number) => boolean) {
    if (!this.controlsEnabled) return;
    
    // Apply gravity
    this.velocity.y += this.gravity * deltaTime;
    
    // Get movement direction
    this.camera.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(this.direction, this.camera.up);
    
    // Calculate movement vector
    const moveVector = new THREE.Vector3();
    
    if (this.moveForward) moveVector.add(this.direction);
    if (this.moveBackward) moveVector.sub(this.direction);
    if (this.moveRight) moveVector.add(right);
    if (this.moveLeft) moveVector.sub(right);
    
    moveVector.normalize();
    moveVector.multiplyScalar(this.moveSpeed * deltaTime);
    
    // Test horizontal movement
    const testPosition = this.firstPersonPosition.clone();
    testPosition.x += moveVector.x;
    testPosition.z += moveVector.z;
    
    if (!this.checkCollision(testPosition, checkCollision)) {
      this.firstPersonPosition.x = testPosition.x;
      this.firstPersonPosition.z = testPosition.z;
    }
    
    // Test vertical movement
    const verticalTestPosition = this.firstPersonPosition.clone();
    verticalTestPosition.y += this.velocity.y * deltaTime;
    
    if (!this.checkCollision(verticalTestPosition, checkCollision)) {
      this.firstPersonPosition.y = verticalTestPosition.y;
      this.isGrounded = false;
    } else {
      if (this.velocity.y < 0) {
        this.isGrounded = true;
        this.canJump = true;
      }
      this.velocity.y = 0;
    }
    
    // Update camera and player mesh positions
    if (this.isThirdPerson) {
      this.updatePlayerMeshPosition();
      this.updateThirdPersonCamera();
    } else {
      this.camera.position.copy(this.firstPersonPosition);
    }
    
    // Update player mesh visibility and position
    if (this.playerMesh) {
      this.updatePlayerMeshPosition();
    }
  }
}