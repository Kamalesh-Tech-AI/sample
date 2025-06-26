import React, { useState, useEffect } from 'react';
import { X, Hammer, Package, Search, Zap, Book, Star } from 'lucide-react';
import { CraftingRecipe, CraftingGrid } from '../types/Crafting';
import { CraftingManager } from '../game/CraftingManager';
import { ItemManager } from '../game/ItemManager';
import { Inventory } from '../game/Inventory';
import { InventorySlot } from '../types/Block';
import { AIService } from '../services/AIService';

interface EnhancedCraftingUIProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Inventory;
  onCraft: (recipe: CraftingRecipe) => void;
  isCraftingTable: boolean;
}

export const EnhancedCraftingUI: React.FC<EnhancedCraftingUIProps> = ({
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
  const [favoriteRecipes, setFavoriteRecipes] = useState<Set<string>>(new Set());
  const [recentRecipes, setRecentRecipes] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<CraftingRecipe[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: Package },
    { id: 'recent', name: 'Recent', icon: Package },
    { id: 'favorites', name: 'Favorites', icon: Star },
    { id: 'building', name: 'Building', icon: Package },
    { id: 'tools', name: 'Tools', icon: Hammer },
    { id: 'weapons', name: 'Weapons', icon: Hammer },
    { id: 'food', name: 'Food', icon: Package },
    { id: 'redstone', name: 'Redstone', icon: Zap },
    { id: 'decorative', name: 'Decorative', icon: Package }
  ];

  useEffect(() => {
    loadUserPreferences();
    if (showAiSuggestions) {
      loadAiSuggestions();
    }
  }, [isOpen, showAiSuggestions]);

  useEffect(() => {
    const result = CraftingManager.findMatchingRecipe(craftingGrid);
    setCurrentRecipe(result.recipe);
  }, [craftingGrid]);

  const loadUserPreferences = () => {
    const favorites = localStorage.getItem('voxelcraft-favorite-recipes');
    const recent = localStorage.getItem('voxelcraft-recent-recipes');
    
    if (favorites) {
      setFavoriteRecipes(new Set(JSON.parse(favorites)));
    }
    if (recent) {
      setRecentRecipes(JSON.parse(recent));
    }
  };

  const loadAiSuggestions = async () => {
    try {
      const aiService = AIService.getInstance();
      const inventoryItems = inventory.getAllSlots()
        .filter(slot => slot.item)
        .map(slot => slot.item!);
      
      // This would be implemented in AIService to suggest recipes
      // For now, we'll use existing recipes as suggestions
      const allRecipes = CraftingManager.getAllRecipes();
      const craftableRecipes = allRecipes.filter(recipe => 
        CraftingManager.canCraftRecipe(recipe, inventory)
      ).slice(0, 5);
      
      setAiSuggestions(craftableRecipes);
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    }
  };

  const getFilteredRecipes = () => {
    let recipes = CraftingManager.getAllRecipes();
    
    if (selectedCategory === 'recent') {
      recipes = recipes.filter(recipe => recentRecipes.includes(recipe.id));
    } else if (selectedCategory === 'favorites') {
      recipes = recipes.filter(recipe => favoriteRecipes.has(recipe.id));
    } else if (selectedCategory !== 'all') {
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

  const handleRecipeClick = (recipe: CraftingRecipe) => {
    if (CraftingManager.canCraftRecipe(recipe, inventory)) {
      onCraft(recipe);
      addToRecentRecipes(recipe.id);
      clearGrid();
    }
  };

  const addToRecentRecipes = (recipeId: string) => {
    const updated = [recipeId, ...recentRecipes.filter(id => id !== recipeId)].slice(0, 10);
    setRecentRecipes(updated);
    localStorage.setItem('voxelcraft-recent-recipes', JSON.stringify(updated));
  };

  const toggleFavorite = (recipeId: string) => {
    const updated = new Set(favoriteRecipes);
    if (updated.has(recipeId)) {
      updated.delete(recipeId);
    } else {
      updated.add(recipeId);
    }
    setFavoriteRecipes(updated);
    localStorage.setItem('voxelcraft-favorite-recipes', JSON.stringify([...updated]));
  };

  const clearGrid = () => {
    setCraftingGrid({
      slots: isCraftingTable ? 
        Array(3).fill(null).map(() => Array(3).fill(null)) :
        Array(2).fill(null).map(() => Array(2).fill(null)),
      size: isCraftingTable ? 3 : 2
    });
  };

  const handleGridSlotClick = (row: number, col: number) => {
    const newGrid = { ...craftingGrid };
    newGrid.slots[row][col] = null;
    setCraftingGrid(newGrid);
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
      <div className="bg-gray-900 rounded-xl border-2 border-green-600 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Hammer className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-green-400">
              {isCraftingTable ? 'Enhanced Crafting Table' : 'Crafting'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiSuggestions(!showAiSuggestions)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                showAiSuggestions
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-1" />
              AI Assist
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[500px]">
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

            {/* AI Suggestions */}
            {showAiSuggestions && aiSuggestions.length > 0 && (
              <div className="mb-4 p-3 bg-purple-900 bg-opacity-30 rounded-lg border border-purple-600">
                <h4 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  AI Suggestions
                </h4>
                <div className="space-y-2">
                  {aiSuggestions.slice(0, 3).map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => handleRecipeClick(recipe)}
                      className="w-full p-2 bg-purple-800 bg-opacity-50 hover:bg-purple-700 rounded text-left transition-colors"
                    >
                      <span className="text-white text-sm">{recipe.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getFilteredRecipes().map(recipe => {
                const canCraft = CraftingManager.canCraftRecipe(recipe, inventory);
                const resultItem = ItemManager.getItem(recipe.result.itemId);
                const isFavorite = favoriteRecipes.has(recipe.id);
                
                return (
                  <div
                    key={recipe.id}
                    className={`p-3 rounded-lg border transition-all ${
                      canCraft
                        ? 'border-green-600 bg-gray-800 hover:bg-gray-700'
                        : 'border-gray-600 bg-gray-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleRecipeClick(recipe)}
                        disabled={!canCraft}
                        className="flex-1 text-left"
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
                      <button
                        onClick={() => toggleFavorite(recipe.id)}
                        className={`p-1 rounded transition-colors ${
                          isFavorite
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-gray-500 hover:text-yellow-400'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Crafting Grid */}
          <div className="w-1/2 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">Crafting Grid</h3>
              <button
                onClick={clearGrid}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Clear
              </button>
            </div>
            
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
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium">{currentRecipe.name}</h4>
                  <button
                    onClick={() => toggleFavorite(currentRecipe.id)}
                    className={`p-1 rounded transition-colors ${
                      favoriteRecipes.has(currentRecipe.id)
                        ? 'text-yellow-400 hover:text-yellow-300'
                        : 'text-gray-500 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-400">Ingredients:</p>
                    <ul className="text-sm text-white">
                      {currentRecipe.ingredients.map((ingredient, index) => {
                        const item = ItemManager.getItem(ingredient.itemId);
                        const available = inventory.getItemQuantity(ingredient.itemId);
                        const hasEnough = available >= ingredient.quantity;
                        
                        return (
                          <li key={index} className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                            {ingredient.quantity}x {item?.name || ingredient.itemId} 
                            <span className="text-gray-500"> ({available} available)</span>
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

            {/* Recipe Book */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Book className="w-4 h-4" />
                Quick Stats
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Total Recipes:</p>
                  <p className="text-white">{CraftingManager.getAllRecipes().length}</p>
                </div>
                <div>
                  <p className="text-gray-400">Craftable Now:</p>
                  <p className="text-green-400">
                    {CraftingManager.getAllRecipes().filter(r => 
                      CraftingManager.canCraftRecipe(r, inventory)
                    ).length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Favorites:</p>
                  <p className="text-yellow-400">{favoriteRecipes.size}</p>
                </div>
                <div>
                  <p className="text-gray-400">Recent:</p>
                  <p className="text-blue-400">{recentRecipes.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};