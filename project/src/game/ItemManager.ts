import { Item, ItemType, BlockType } from '../types/Block';

export class ItemManager {
  private static items: Map<string, Item> = new Map();

  static initialize() {
    // Block items
    this.registerItem({
      id: 'grass',
      name: 'Grass Block',
      type: ItemType.BLOCK,
      blockType: BlockType.GRASS,
      stackSize: 64
    });

    this.registerItem({
      id: 'dirt',
      name: 'Dirt',
      type: ItemType.BLOCK,
      blockType: BlockType.DIRT,
      stackSize: 64
    });

    this.registerItem({
      id: 'stone',
      name: 'Stone',
      type: ItemType.BLOCK,
      blockType: BlockType.STONE,
      stackSize: 64
    });

    this.registerItem({
      id: 'wood',
      name: 'Wood Log',
      type: ItemType.BLOCK,
      blockType: BlockType.WOOD,
      stackSize: 64
    });

    this.registerItem({
      id: 'planks',
      name: 'Wood Planks',
      type: ItemType.BLOCK,
      blockType: BlockType.PLANKS,
      stackSize: 64
    });

    this.registerItem({
      id: 'leaves',
      name: 'Leaves',
      type: ItemType.BLOCK,
      blockType: BlockType.LEAVES,
      stackSize: 64
    });

    this.registerItem({
      id: 'sand',
      name: 'Sand',
      type: ItemType.BLOCK,
      blockType: BlockType.SAND,
      stackSize: 64
    });

    this.registerItem({
      id: 'cobblestone',
      name: 'Cobblestone',
      type: ItemType.BLOCK,
      blockType: BlockType.COBBLESTONE,
      stackSize: 64
    });

    this.registerItem({
      id: 'glass',
      name: 'Glass',
      type: ItemType.BLOCK,
      blockType: BlockType.GLASS,
      stackSize: 64
    });

    // Ore blocks
    this.registerItem({
      id: 'coal_ore',
      name: 'Coal Ore',
      type: ItemType.BLOCK,
      blockType: BlockType.COAL_ORE,
      stackSize: 64
    });

    this.registerItem({
      id: 'iron_ore',
      name: 'Iron Ore',
      type: ItemType.BLOCK,
      blockType: BlockType.IRON_ORE,
      stackSize: 64
    });

    this.registerItem({
      id: 'gold_ore',
      name: 'Gold Ore',
      type: ItemType.BLOCK,
      blockType: BlockType.GOLD_ORE,
      stackSize: 64
    });

    this.registerItem({
      id: 'diamond_ore',
      name: 'Diamond Ore',
      type: ItemType.BLOCK,
      blockType: BlockType.DIAMOND_ORE,
      stackSize: 64
    });

    // Crafting materials
    this.registerItem({
      id: 'stick',
      name: 'Stick',
      type: ItemType.TOOL,
      stackSize: 64
    });

    this.registerItem({
      id: 'iron_ingot',
      name: 'Iron Ingot',
      type: ItemType.TOOL,
      stackSize: 64
    });

    this.registerItem({
      id: 'gold_ingot',
      name: 'Gold Ingot',
      type: ItemType.TOOL,
      stackSize: 64
    });

    this.registerItem({
      id: 'diamond',
      name: 'Diamond',
      type: ItemType.TOOL,
      stackSize: 64
    });

    this.registerItem({
      id: 'wheat',
      name: 'Wheat',
      type: ItemType.FOOD,
      stackSize: 64
    });

    // Special blocks
    this.registerItem({
      id: 'crafting_table',
      name: 'Crafting Table',
      type: ItemType.BLOCK,
      blockType: BlockType.WOOD, // Temporary - would need new block type
      stackSize: 64
    });

    this.registerItem({
      id: 'furnace',
      name: 'Furnace',
      type: ItemType.BLOCK,
      blockType: BlockType.STONE, // Temporary - would need new block type
      stackSize: 64
    });

    // Tools
    this.registerItem({
      id: 'wooden_pickaxe',
      name: 'Wooden Pickaxe',
      type: ItemType.TOOL,
      durability: 59,
      maxDurability: 59,
      damage: 2,
      stackSize: 1
    });

    this.registerItem({
      id: 'stone_pickaxe',
      name: 'Stone Pickaxe',
      type: ItemType.TOOL,
      durability: 131,
      maxDurability: 131,
      damage: 3,
      stackSize: 1
    });

    this.registerItem({
      id: 'iron_pickaxe',
      name: 'Iron Pickaxe',
      type: ItemType.TOOL,
      durability: 250,
      maxDurability: 250,
      damage: 4,
      stackSize: 1
    });

    this.registerItem({
      id: 'diamond_pickaxe',
      name: 'Diamond Pickaxe',
      type: ItemType.TOOL,
      durability: 1561,
      maxDurability: 1561,
      damage: 5,
      stackSize: 1
    });

    // Weapons
    this.registerItem({
      id: 'wooden_sword',
      name: 'Wooden Sword',
      type: ItemType.WEAPON,
      durability: 59,
      maxDurability: 59,
      damage: 4,
      stackSize: 1
    });

    this.registerItem({
      id: 'stone_sword',
      name: 'Stone Sword',
      type: ItemType.WEAPON,
      durability: 131,
      maxDurability: 131,
      damage: 5,
      stackSize: 1
    });

    this.registerItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      type: ItemType.WEAPON,
      durability: 250,
      maxDurability: 250,
      damage: 6,
      stackSize: 1
    });

    this.registerItem({
      id: 'diamond_sword',
      name: 'Diamond Sword',
      type: ItemType.WEAPON,
      durability: 1561,
      maxDurability: 1561,
      damage: 7,
      stackSize: 1
    });

    // Armor
    this.registerItem({
      id: 'leather_helmet',
      name: 'Leather Helmet',
      type: ItemType.ARMOR,
      durability: 55,
      maxDurability: 55,
      protection: 1,
      stackSize: 1
    });

    this.registerItem({
      id: 'iron_helmet',
      name: 'Iron Helmet',
      type: ItemType.ARMOR,
      durability: 165,
      maxDurability: 165,
      protection: 2,
      stackSize: 1
    });

    this.registerItem({
      id: 'diamond_helmet',
      name: 'Diamond Helmet',
      type: ItemType.ARMOR,
      durability: 363,
      maxDurability: 363,
      protection: 3,
      stackSize: 1
    });

    // Food
    this.registerItem({
      id: 'bread',
      name: 'Bread',
      type: ItemType.FOOD,
      stackSize: 64
    });

    this.registerItem({
      id: 'apple',
      name: 'Apple',
      type: ItemType.FOOD,
      stackSize: 64
    });

    this.registerItem({
      id: 'cooked_beef',
      name: 'Cooked Beef',
      type: ItemType.FOOD,
      stackSize: 64
    });

    this.registerItem({
      id: 'golden_apple',
      name: 'Golden Apple',
      type: ItemType.FOOD,
      stackSize: 64
    });
  }

  static registerItem(item: Item) {
    this.items.set(item.id, { ...item });
  }

  static getItem(id: string): Item | null {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  static getAllItems(): Item[] {
    return Array.from(this.items.values()).map(item => ({ ...item }));
  }

  static getBlockItem(blockType: BlockType): Item | null {
    for (const item of this.items.values()) {
      if (item.blockType === blockType) {
        return { ...item };
      }
    }
    return null;
  }
}