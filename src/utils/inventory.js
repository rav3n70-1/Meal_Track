// Inventory management utilities

/**
 * Inventory item categories
 */
export const INVENTORY_CATEGORIES = [
  { id: 'pantry', label: 'Pantry', emoji: '🥫' },
  { id: 'refrigerated', label: 'Refrigerated', emoji: '🧊' },
  { id: 'frozen', label: 'Frozen', emoji: '❄️' },
  { id: 'beverages', label: 'Beverages', emoji: '🥤' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'cleaning', label: 'Cleaning', emoji: '🧹' },
  { id: 'personal', label: 'Personal Care', emoji: '🧴' },
  { id: 'other', label: 'Other', emoji: '📦' }
];

/**
 * Unit types for inventory
 */
export const INVENTORY_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'pcs', label: 'Pieces' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'box', label: 'Box' },
  { value: 'bag', label: 'Bag' }
];

/**
 * Check if item is low stock
 */
export const isLowStock = (item) => {
  if (!item.minQuantity) return false;
  return item.currentQuantity <= item.minQuantity;
};

/**
 * Check if item is out of stock
 */
export const isOutOfStock = (item) => {
  return item.currentQuantity <= 0;
};

/**
 * Get stock status
 */
export const getStockStatus = (item) => {
  if (isOutOfStock(item)) {
    return { status: 'out', label: 'Out of Stock', color: 'red' };
  }
  if (isLowStock(item)) {
    return { status: 'low', label: 'Low Stock', color: 'orange' };
  }
  return { status: 'good', label: 'In Stock', color: 'green' };
};

/**
 * Generate shopping list from low stock items
 */
export const generateShoppingList = (inventoryItems) => {
  const lowStockItems = inventoryItems.filter(item => 
    isLowStock(item) || isOutOfStock(item)
  );

  return lowStockItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    currentQuantity: item.currentQuantity,
    neededQuantity: item.minQuantity - item.currentQuantity,
    unit: item.unit,
    estimatedCost: item.avgPrice * (item.minQuantity - item.currentQuantity),
    priority: isOutOfStock(item) ? 'high' : 'medium'
  }));
};

/**
 * Calculate total inventory value
 */
export const calculateInventoryValue = (inventoryItems) => {
  return inventoryItems.reduce((total, item) => {
    const value = (item.avgPrice || 0) * (item.currentQuantity || 0);
    return total + value;
  }, 0);
};

/**
 * Get items expiring soon (within days)
 */
export const getExpiringItems = (inventoryItems, withinDays = 7) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + withinDays);

  return inventoryItems.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    return expiryDate >= today && expiryDate <= futureDate;
  });
};

/**
 * Update quantity after consumption
 */
export const consumeItem = (item, quantity) => {
  const newQuantity = Math.max(0, item.currentQuantity - quantity);
  return {
    ...item,
    currentQuantity: newQuantity,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Add stock to item
 */
export const addStock = (item, quantity, price = null) => {
  const newQuantity = item.currentQuantity + quantity;
  const updates = {
    ...item,
    currentQuantity: newQuantity,
    lastUpdated: new Date().toISOString()
  };

  // Update average price if price is provided
  if (price) {
    const totalValue = (item.avgPrice * item.currentQuantity) + (price * quantity);
    updates.avgPrice = totalValue / newQuantity;
  }

  return updates;
};

