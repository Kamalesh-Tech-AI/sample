import { CraftingRecipe, CraftingGrid, CraftingResult } from '../types/Crafting';
import { ItemManager } from './ItemManager';
import { Inventory } from './Inventory';

export class CraftingManager {
  private static recipes: Map<string, CraftingRecipe> = new Map();

  static initialize() {
    // Basic building blocks
    this.registerRecipe({
      id: 'planks_from_wood',
      name: 'Wood Planks',
      result: { itemId: 'planks', quantity: 4 },
      ingredients: [{ itemId: 'wood', quantity: 1 }],
      type: 'shapeless',
      category: 'building',
      requiresCraftingTable: false
    });

    this.registerRecipe({
      id: 'sticks',
      name: 'Sticks',
      result: { itemId: 'stick', quantity: 4 },
      ingredients: [
        { itemId: 'planks', quantity: 2, position: { row: 0, col: 1 } },
        { itemId: 'planks', quantity: 1, position: { row: 1, col: 1 } }
      ],
      type: 'shaped',
      category: 'building',
      requiresCraftingTable: false
    });

    // Tools
    this.registerRecipe({
      id: 'wooden_pickaxe',
      name: 'Wooden Pickaxe',
      result: { itemId: 'wooden_pickaxe', quantity: 1 },
      ingredients: [
        { itemId: 'planks', quantity: 1, position: { row: 0, col: 0 } },
        { itemId: 'planks', quantity: 1, position: { row: 0, col: 1 } },
        { itemId: 'planks', quantity: 1, position: { row: 0, col: 2 } },
        { itemId: 'stick', quantity: 1, position: { row: 1, col: 1 } },
        { itemId: 'stick', quantity: 1, position: { row: 2, col: 1 } }
      ],
      type: 'shaped',
      category: 'tools',
      requiresCraftingTable: true
    });

    this.registerRecipe({
      id: 'stone_pickaxe',
      name: 'Stone Pickaxe',
      result: { itemId: 'stone_pickaxe', quantity: 1 },
      ingredients: [
        { itemId: 'cobblestone', quantity: 1, position: { row: 0, col: 0 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 0, col: 1 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 0, col: 2 } },
        { itemId: 'stick', quantity: 1, position: { row: 1, col: 1 } },
        { itemId: 'stick', quantity: 1, position: { row: 2, col: 1 } }
      ],
      type: 'shaped',
      category: 'tools',
      requiresCraftingTable: true
    });

    this.registerRecipe({
      id: 'iron_pickaxe',
      name: 'Iron Pickaxe',
      result: { itemId: 'iron_pickaxe', quantity: 1 },
      ingredients: [
        { itemId: 'iron_ingot', quantity: 1, position: { row: 0, col: 0 } },
        { itemId: 'iron_ingot', quantity: 1, position: { row: 0, col: 1 } },
        { itemId: 'iron_ingot', quantity: 1, position: { row: 0, col: 2 } },
        { itemId: 'stick', quantity: 1, position: { row: 1, col: 1 } },
        { itemId: 'stick', quantity: 1, position: { row: 2, col: 1 } }
      ],
      type: 'shaped',
      category: 'tools',
      requiresCraftingTable: true
    });

    // Weapons
    this.registerRecipe({
      id: 'wooden_sword',
      name: 'Wooden Sword',
      result: { itemId: 'wooden_sword', quantity: 1 },
      ingredients: [
        { itemId: 'planks', quantity: 1, position: { row: 0, col: 1 } },
        { itemId: 'planks', quantity: 1, position: { row: 1, col: 1 } },
        { itemId: 'stick', quantity: 1, position: { row: 2, col: 1 } }
      ],
      type: 'shaped',
      category: 'weapons',
      requiresCraftingTable: true
    });

    this.registerRecipe({
      id: 'stone_sword',
      name: 'Stone Sword',
      result: { itemId: 'stone_sword', quantity: 1 },
      ingredients: [
        { itemId: 'cobblestone', quantity: 1, position: { row: 0, col: 1 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 1, col: 1 } },
        { itemId: 'stick', quantity: 1, position: { row: 2, col: 1 } }
      ],
      type: 'shaped',
      category: 'weapons',
      requiresCraftingTable: true
    });

    // Food
    this.registerRecipe({
      id: 'bread',
      name: 'Bread',
      result: { itemId: 'bread', quantity: 1 },
      ingredients: [
        { itemId: 'wheat', quantity: 1, position: { row: 0, col: 0 } },
        { itemId: 'wheat', quantity: 1, position: { row: 0, col: 1 } },
        { itemId: 'wheat', quantity: 1, position: { row: 0, col: 2 } }
      ],
      type: 'shaped',
      category: 'food',
      requiresCraftingTable: true
    });

    // Building blocks
    this.registerRecipe({
      id: 'crafting_table',
      name: 'Crafting Table',
      result: { itemId: 'crafting_table', quantity: 1 },
      ingredients: [
        { itemId: 'planks', quantity: 1, position: { row: 0, col: 0 } },
        { itemId: 'planks', quantity: 1, position: { row: 0, col: 1 } },
        { itemId: 'planks', quantity: 1, position: { row: 1, col: 0 } },
        { itemId: 'planks', quantity: 1, position: { row: 1, col: 1 } }
      ],
      type: 'shaped',
      category: 'building',
      requiresCraftingTable: false
    });

    this.registerRecipe({
      id: 'furnace',
      name: 'Furnace',
      result: { itemId: 'furnace', quantity: 1 },
      ingredients: [
        { itemId: 'cobblestone', quantity: 1, position: { row: 0, col: 0 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 0, col: 1 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 0, col: 2 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 1, col: 0 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 1, col: 2 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 2, col: 0 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 2, col: 1 } },
        { itemId: 'cobblestone', quantity: 1, position: { row: 2, col: 2 } }
      ],
      type: 'shaped',
      category: 'building',
      requiresCraftingTable: true
    });
  }

  static registerRecipe(recipe: CraftingRecipe) {
    this.recipes.set(recipe.id, recipe);
  }

  static getRecipe(id: string): CraftingRecipe | null {
    return this.recipes.get(id) || null;
  }

  static getAllRecipes(): CraftingRecipe[] {
    return Array.from(this.recipes.values());
  }

  static getRecipesByCategory(category: string): CraftingRecipe[] {
    return Array.from(this.recipes.values()).filter(recipe => recipe.category === category);
  }

  static findMatchingRecipe(grid: CraftingGrid): CraftingResult {
    for (const recipe of this.recipes.values()) {
      if (this.matchesRecipe(grid, recipe)) {
        return {
          recipe,
          canCraft: true,
          missingItems: []
        };
      }
    }

    return {
      recipe: null,
      canCraft: false,
      missingItems: []
    };
  }

  private static matchesRecipe(grid: CraftingGrid, recipe: CraftingRecipe): boolean {
    if (recipe.requiresCraftingTable && grid.size === 2) {
      return false;
    }

    if (recipe.type === 'shapeless') {
      return this.matchesShapelessRecipe(grid, recipe);
    } else {
      return this.matchesShapedRecipe(grid, recipe);
    }
  }

  private static matchesShapelessRecipe(grid: CraftingGrid, recipe: CraftingRecipe): boolean {
    const gridItems: string[] = [];
    
    // Collect all non-null items from grid
    for (let row = 0; row < grid.size; row++) {
      for (let col = 0; col < grid.size; col++) {
        if (grid.slots[row][col]) {
          gridItems.push(grid.slots[row][col]!);
        }
      }
    }

    // Check if we have exactly the required ingredients
    const requiredItems = recipe.ingredients.map(ing => ing.itemId);
    
    if (gridItems.length !== requiredItems.length) {
      return false;
    }

    const gridItemCounts = this.countItems(gridItems);
    const requiredItemCounts = this.countItems(requiredItems);

    for (const [itemId, count] of Object.entries(requiredItemCounts)) {
      if (gridItemCounts[itemId] !== count) {
        return false;
      }
    }

    return true;
  }

  private static matchesShapedRecipe(grid: CraftingGrid, recipe: CraftingRecipe): boolean {
    // Create a pattern from the recipe
    const recipePattern: (string | null)[][] = Array(3).fill(null).map(() => Array(3).fill(null));
    
    for (const ingredient of recipe.ingredients) {
      if (ingredient.position) {
        recipePattern[ingredient.position.row][ingredient.position.col] = ingredient.itemId;
      }
    }

    // Try to match the pattern in different positions
    for (let offsetRow = 0; offsetRow <= 3 - grid.size; offsetRow++) {
      for (let offsetCol = 0; offsetCol <= 3 - grid.size; offsetCol++) {
        if (this.matchesPatternAtOffset(grid, recipePattern, offsetRow, offsetCol)) {
          return true;
        }
      }
    }

    return false;
  }

  private static matchesPatternAtOffset(
    grid: CraftingGrid, 
    pattern: (string | null)[][], 
    offsetRow: number, 
    offsetCol: number
  ): boolean {
    // Check if the grid matches the pattern at the given offset
    for (let row = 0; row < grid.size; row++) {
      for (let col = 0; col < grid.size; col++) {
        const patternItem = pattern[row + offsetRow][col + offsetCol];
        const gridItem = grid.slots[row][col];
        
        if (patternItem !== gridItem) {
          return false;
        }
      }
    }

    // Also check that no other pattern cells are filled
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if ((row < offsetRow || row >= offsetRow + grid.size || 
             col < offsetCol || col >= offsetCol + grid.size) && 
            pattern[row][col] !== null) {
          return false;
        }
      }
    }

    return true;
  }

  private static countItems(items: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }
    return counts;
  }

  static canCraftRecipe(recipe: CraftingRecipe, inventory: Inventory): boolean {
    for (const ingredient of recipe.ingredients) {
      const availableQuantity = inventory.getItemQuantity(ingredient.itemId);
      if (availableQuantity < ingredient.quantity) {
        return false;
      }
    }
    return true;
  }

  static craftRecipe(recipe: CraftingRecipe, inventory: Inventory): boolean {
    if (!this.canCraftRecipe(recipe, inventory)) {
      return false;
    }

    // Remove ingredients
    for (const ingredient of recipe.ingredients) {
      inventory.removeItemById(ingredient.itemId, ingredient.quantity);
    }

    // Add result
    const resultItem = ItemManager.getItem(recipe.result.itemId);
    if (resultItem) {
      inventory.addItem(resultItem, recipe.result.quantity);
    }

    return true;
  }
}