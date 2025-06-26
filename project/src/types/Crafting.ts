export interface CraftingRecipe {
  id: string;
  name: string;
  result: {
    itemId: string;
    quantity: number;
  };
  ingredients: {
    itemId: string;
    quantity: number;
    position?: { row: number; col: number }; // For shaped recipes
  }[];
  type: 'shaped' | 'shapeless';
  category: 'building' | 'tools' | 'weapons' | 'armor' | 'food' | 'decorative';
  requiresCraftingTable: boolean;
}

export interface CraftingGrid {
  slots: (string | null)[][]; // 3x3 grid for crafting table, 2x2 for inventory
  size: 2 | 3;
}

export interface CraftingResult {
  recipe: CraftingRecipe | null;
  canCraft: boolean;
  missingItems: string[];
}