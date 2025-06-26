import * as THREE from 'three';
import { BlockType, Block } from '../types/Block';
import { Chunk } from './Chunk';

export class World {
  private chunks: Map<string, Chunk> = new Map();
  private scene: THREE.Scene;
  private chunkSize = 32;
  private worldHeight = 128;
  private renderDistance = 6; // Reduced for better performance
  private spawnPoint = new THREE.Vector3(0, 70, 0);
  private worldBounds = {
    min: new THREE.Vector3(-1000, 0, -1000),
    max: new THREE.Vector3(1000, this.worldHeight, 1000)
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generateInitialChunks();
  }

  private generateInitialChunks() {
    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        this.generateChunk(x, z);
      }
    }
  }

  private generateChunk(chunkX: number, chunkZ: number) {
    const chunkKey = `${chunkX},${chunkZ}`;
    if (this.chunks.has(chunkKey)) return;

    const chunk = new Chunk(chunkX, chunkZ, this.chunkSize, this.worldHeight);
    chunk.generate();
    chunk.createMesh(this.scene);
    this.chunks.set(chunkKey, chunk);
  }

  updateChunks(playerPosition: THREE.Vector3) {
    const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
    const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);

    // Generate new chunks around player
    for (let x = playerChunkX - this.renderDistance; x <= playerChunkX + this.renderDistance; x++) {
      for (let z = playerChunkZ - this.renderDistance; z <= playerChunkZ + this.renderDistance; z++) {
        const distance = Math.sqrt((x - playerChunkX) ** 2 + (z - playerChunkZ) ** 2);
        if (distance <= this.renderDistance) {
          this.generateChunk(x, z);
        }
      }
    }

    // Remove distant chunks
    const chunksToRemove: string[] = [];
    this.chunks.forEach((chunk, key) => {
      const [chunkX, chunkZ] = key.split(',').map(Number);
      const distance = Math.sqrt((chunkX - playerChunkX) ** 2 + (chunkZ - playerChunkZ) ** 2);
      if (distance > this.renderDistance + 2) {
        chunksToRemove.push(key);
      }
    });

    chunksToRemove.forEach(key => {
      const chunk = this.chunks.get(key);
      if (chunk) {
        chunk.dispose(this.scene);
        this.chunks.delete(key);
      }
    });
  }

  isOutOfBounds(position: THREE.Vector3): boolean {
    return position.x < this.worldBounds.min.x || 
           position.x > this.worldBounds.max.x ||
           position.y < this.worldBounds.min.y ||
           position.y > this.worldBounds.max.y ||
           position.z < this.worldBounds.min.z ||
           position.z > this.worldBounds.max.z;
  }

  getSpawnPoint(): THREE.Vector3 {
    return this.spawnPoint.clone();
  }

  findSafeSpawnPoint(nearPosition?: THREE.Vector3): THREE.Vector3 {
    const searchCenter = nearPosition || new THREE.Vector3(0, 0, 0);
    
    for (let radius = 0; radius < 50; radius += 5) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const testX = Math.floor(searchCenter.x + Math.cos(angle) * radius);
        const testZ = Math.floor(searchCenter.z + Math.sin(angle) * radius);
        
        for (let y = this.worldHeight - 1; y > 10; y--) {
          if (this.getBlock(testX, y, testZ) !== BlockType.AIR) {
            if (this.getBlock(testX, y + 1, testZ) === BlockType.AIR && 
                this.getBlock(testX, y + 2, testZ) === BlockType.AIR &&
                this.getBlock(testX, y + 3, testZ) === BlockType.AIR) {
              return new THREE.Vector3(testX + 0.5, y + 3, testZ + 0.5);
            }
          }
        }
      }
    }
    
    return this.spawnPoint.clone();
  }

  getBlock(x: number, y: number, z: number): BlockType {
    if (y < 0 || y >= this.worldHeight) return BlockType.AIR;
    
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);
    const chunkKey = `${chunkX},${chunkZ}`;
    const chunk = this.chunks.get(chunkKey);
    
    if (!chunk) return BlockType.AIR;
    
    const localX = x - chunkX * this.chunkSize;
    const localZ = z - chunkZ * this.chunkSize;
    
    if (localX < 0 || localX >= this.chunkSize || localZ < 0 || localZ >= this.chunkSize) {
      return BlockType.AIR;
    }
    
    return chunk.getBlock(localX, y, localZ);
  }

  setBlock(x: number, y: number, z: number, blockType: BlockType) {
    if (y < 0 || y >= this.worldHeight) return;
    
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);
    const chunkKey = `${chunkX},${chunkZ}`;
    const chunk = this.chunks.get(chunkKey);
    
    if (!chunk) return;
    
    const localX = x - chunkX * this.chunkSize;
    const localZ = z - chunkZ * this.chunkSize;
    
    if (localX < 0 || localX >= this.chunkSize || localZ < 0 || localZ >= this.chunkSize) {
      return;
    }
    
    chunk.setBlock(localX, y, localZ, blockType);
    chunk.updateMesh(this.scene);
    
    this.updateNeighboringChunks(chunkX, chunkZ, localX, localZ);
  }

  private updateNeighboringChunks(chunkX: number, chunkZ: number, localX: number, localZ: number) {
    const neighbors = [];
    
    if (localX === 0) neighbors.push([chunkX - 1, chunkZ]);
    if (localX === this.chunkSize - 1) neighbors.push([chunkX + 1, chunkZ]);
    if (localZ === 0) neighbors.push([chunkX, chunkZ - 1]);
    if (localZ === this.chunkSize - 1) neighbors.push([chunkX, chunkZ + 1]);
    
    neighbors.forEach(([nx, nz]) => {
      const neighborChunk = this.chunks.get(`${nx},${nz}`);
      if (neighborChunk) {
        neighborChunk.updateMesh(this.scene);
      }
    });
  }

  raycast(raycaster: THREE.Raycaster): { block: Block; face: THREE.Vector3 } | null {
    const maxDistance = 8;
    const step = 0.1;
    const direction = raycaster.ray.direction.clone();
    const origin = raycaster.ray.origin.clone();

    for (let distance = 0; distance < maxDistance; distance += step) {
      const currentPos = origin.clone().add(direction.clone().multiplyScalar(distance));
      const blockX = Math.floor(currentPos.x);
      const blockY = Math.floor(currentPos.y);
      const blockZ = Math.floor(currentPos.z);

      const blockType = this.getBlock(blockX, blockY, blockZ);
      if (blockType !== BlockType.AIR) {
        const prevPos = origin.clone().add(direction.clone().multiplyScalar(distance - step));
        const prevX = Math.floor(prevPos.x);
        const prevY = Math.floor(prevPos.y);
        const prevZ = Math.floor(prevPos.z);

        return {
          block: { type: blockType, x: blockX, y: blockY, z: blockZ },
          face: new THREE.Vector3(prevX, prevY, prevZ)
        };
      }
    }

    return null;
  }

  getWorldData(): any {
    const chunkData: any = {};
    this.chunks.forEach((chunk, key) => {
      chunkData[key] = chunk.getBlockData();
    });

    return {
      chunks: chunkData,
      spawnPoint: this.spawnPoint.toArray(),
      worldBounds: {
        min: this.worldBounds.min.toArray(),
        max: this.worldBounds.max.toArray()
      },
      chunkSize: this.chunkSize,
      worldHeight: this.worldHeight
    };
  }

  loadWorldData(data: any) {
    if (data.chunks) {
      this.chunks.forEach(chunk => chunk.dispose(this.scene));
      this.chunks.clear();

      Object.entries(data.chunks).forEach(([key, chunkData]) => {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        const chunk = new Chunk(chunkX, chunkZ, this.chunkSize, this.worldHeight);
        chunk.loadBlockData(chunkData);
        chunk.createMesh(this.scene);
        this.chunks.set(key, chunk);
      });
    }

    if (data.spawnPoint) {
      this.spawnPoint.fromArray(data.spawnPoint);
    }
  }
}