import React, { useState, useEffect } from 'react';
import { X, Hammer, Package, Search } from 'lucide-react';
import { CraftingRecipe, CraftingGrid } from '../types/Crafting';
import { CraftingManager } from '../game/CraftingManager';
import { ItemManager } from '../game/ItemManager';
import { Inventory } from '../game/Inventory';
import { InventorySlot } from '../types/Block';

interface CraftingUIProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Inventory;
  onCraft: (recipe: CraftingRecipe) => void;
  isCraftingTable: boolean;
}

export const CraftingUI: React.FC<CraftingUIProps> = ({
  isOpen,
  onClose,
  inventory,
  onCraft,
  isCraftingTable
}) => {
  const [craftingGrid, setCraftingGrid] = useState<CraftingGrid>({
    slots: isCraftingTable ? 
      Array(3).fill(null).map(() => Array(3).fill(null)) :
      Array(2).fill(null).map(() => Array(2).fill(null)),
    size: isCraftingTable ? 3 : 2
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentRecipe, setCurrentRecipe] = useState<CraftingRecipe | null>(null);

  const categories = [
    { id: 'all', name: 'All', icon: Package },
    { id: 'building', name: 'Building', icon: Package },
    { id: 'tools', name: 'Tools', icon: Hammer },
    { id: 'weapons', name: 'Weapons', icon: Hammer },
    { id: 'food', name: 'Food', icon: Package }
  ];

  useEffect(() => {
    // Check for matching recipe when grid changes
    const result = CraftingManager.findMatchingRecipe(craftingGrid);
    setCurrentRecipe(result.recipe);
  }, [craftingGrid]);

  const getFilteredRecipes = () => {
    let recipes = CraftingManager.getAllRecipes();
    
    if (selectedCategory !== 'all') {
      recipes = recipes.filter(recipe => recipe.category === selectedCategory);
    }
    
    if (!isCraftingTable) {
      recipes = recipes.filter(recipe => !recipe.requiresCraftingTable);
    }
    
    if (searchQuery) {
      recipes = recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return recipes;
  };

  const handleGridSlotClick = (row: number, col: number) => {
    // For now, just clear the slot - in a full implementation, 
    // this would handle item placement from inventory
    const newGrid = { ...craftingGrid };
    newGrid.slots[row][col] = null;
    setCraftingGrid(newGrid);
  };

  const handleRecipeClick = (recipe: CraftingRecipe) => {
    if (CraftingManager.canCraftRecipe(recipe, inventory)) {
      onCraft(recipe);
      // Clear the grid after crafting
      setCraftingGrid({
        slots: isCraftingTable ? 
          Array(3).fill(null).map(() => Array(3).fill(null)) :
          Array(2).fill(null).map(() => Array(2).fill(null)),
        size: isCraftingTable ? 3 : 2
      });
    }
  };

  const getItemIcon = (itemId: string | null) => {
    if (!itemId) return null;
    
    const item = ItemManager.getItem(itemId);
    if (!item) return null;
    
    return (
      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs">
        {item.name.charAt(0)}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border-2 border-green-600 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Hammer className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-green-400">
              {isCraftingTable ? 'Crafting Table' : 'Crafting'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-96">
          {/* Recipe List */}
          <div className="w-1/2 p-4 border-r border-gray-700">
            {/* Search and Categories */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipe List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getFilteredRecipes().map(recipe => {
                const canCraft = CraftingManager.canCraftRecipe(recipe, inventory);
                const resultItem = ItemManager.getItem(recipe.result.itemId);
                
                return (
                  <button
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe)}
                    disabled={!canCraft}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      canCraft
                        ? 'border-green-600 bg-gray-800 hover:bg-gray-700'
                        : 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getItemIcon(recipe.result.itemId)}
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{recipe.name}</h4>
                        <p className="text-sm text-gray-400">
                          Makes {recipe.result.quantity} {resultItem?.name}
                        </p>
                        {recipe.requiresCraftingTable && !isCraftingTable && (
                          <p className="text-xs text-red-400">Requires Crafting Table</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crafting Grid */}
          <div className="w-1/2 p-4">
            <h3 className="text-white font-medium mb-4">Crafting Grid</h3>
            
            <div className="flex items-center justify-center mb-6">
              <div className={`grid gap-1 ${isCraftingTable ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {craftingGrid.slots.map((row, rowIndex) =>
                  row.map((slot, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleGridSlotClick(rowIndex, colIndex)}
                      className="w-12 h-12 border-2 border-gray-600 rounded bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      {getItemIcon(slot)}
                    </button>
                  ))
                )}
              </div>
              
              <div className="mx-6 text-white text-2xl">→</div>
              
              <div className="w-12 h-12 border-2 border-green-600 rounded bg-gray-800 flex items-center justify-center">
                {currentRecipe && getItemIcon(currentRecipe.result.itemId)}
              </div>
            </div>

            {/* Current Recipe Info */}
            {currentRecipe && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">{currentRecipe.name}</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-400">Ingredients:</p>
                    <ul className="text-sm text-white">
                      {currentRecipe.ingredients.map((ingredient, index) => {
                        const item = ItemManager.getItem(ingredient.itemId);
                        return (
                          <li key={index}>
                            {ingredient.quantity}x {item?.name || ingredient.itemId}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Result:</p>
                    <p className="text-sm text-white">
                      {currentRecipe.result.quantity}x {ItemManager.getItem(currentRecipe.result.itemId)?.name}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRecipeClick(currentRecipe)}
                  disabled={!CraftingManager.canCraftRecipe(currentRecipe, inventory)}
                  className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Craft
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};