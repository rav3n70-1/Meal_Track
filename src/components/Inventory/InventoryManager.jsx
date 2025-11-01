// Inventory Management Component
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { 
  INVENTORY_CATEGORIES, 
  INVENTORY_UNITS, 
  getStockStatus, 
  generateShoppingList,
  calculateInventoryValue
} from '../../utils/inventory';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { Package, Plus, Edit, Trash2, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const InventoryManager = () => {
  const { household } = useHousehold();
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all'); // all, low, out

  const [formData, setFormData] = useState({
    name: '',
    category: 'pantry',
    currentQuantity: '',
    minQuantity: '',
    unit: 'pcs',
    avgPrice: '',
    expiryDate: ''
  });

  // Load inventory
  useEffect(() => {
    if (!household) return;

    const inventoryRef = collection(db, 'households', household.id, 'inventory');
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsData);
    });

    return () => unsubscribe();
  }, [household]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'pantry',
      currentQuantity: '',
      minQuantity: '',
      unit: 'pcs',
      avgPrice: '',
      expiryDate: ''
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const itemData = {
        name: formData.name.trim(),
        category: formData.category,
        currentQuantity: parseFloat(formData.currentQuantity),
        minQuantity: parseFloat(formData.minQuantity) || 0,
        unit: formData.unit,
        avgPrice: parseFloat(formData.avgPrice) || 0,
        expiryDate: formData.expiryDate || null,
        updatedBy: currentUser.uid,
        updatedAt: new Date().toISOString()
      };

      if (editingItem) {
        const itemRef = doc(db, 'households', household.id, 'inventory', editingItem.id);
        await updateDoc(itemRef, itemData);
        toast.success('Item updated!');
      } else {
        const inventoryRef = collection(db, 'households', household.id, 'inventory');
        await addDoc(inventoryRef, {
          ...itemData,
          createdBy: currentUser.uid,
          createdAt: new Date().toISOString()
        });
        toast.success('Item added to inventory!');
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      currentQuantity: item.currentQuantity.toString(),
      minQuantity: item.minQuantity.toString(),
      unit: item.unit,
      avgPrice: item.avgPrice.toString(),
      expiryDate: item.expiryDate || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Delete this item from inventory?')) return;

    try {
      const itemRef = doc(db, 'households', household.id, 'inventory', itemId);
      await deleteDoc(itemRef);
      toast.success('Item deleted!');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const updateQuantity = async (item, change) => {
    const newQuantity = Math.max(0, item.currentQuantity + change);
    try {
      const itemRef = doc(db, 'households', household.id, 'inventory', item.id);
      await updateDoc(itemRef, {
        currentQuantity: newQuantity,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const filteredItems = items.filter(item => {
    const status = getStockStatus(item);
    if (filter === 'low') return status.status === 'low';
    if (filter === 'out') return status.status === 'out';
    return true;
  });

  const shoppingList = generateShoppingList(items);
  const totalValue = calculateInventoryValue(items);
  const lowStockCount = items.filter(item => getStockStatus(item).status === 'low').length;
  const outOfStockCount = items.filter(item => getStockStatus(item).status === 'out').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">Track household items and supplies</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={<ShoppingCart size={18} />}
            onClick={() => setShowShoppingList(true)}
          >
            Shopping List ({shoppingList.length})
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <AlertTriangle className="text-orange-500" size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">{outOfStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">৳{totalValue.toFixed(0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All Items' },
          { value: 'low', label: 'Low Stock' },
          { value: 'out', label: 'Out of Stock' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const status = getStockStatus(item);
          const category = INVENTORY_CATEGORIES.find(c => c.id === item.category);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card className="relative overflow-hidden">
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{category?.emoji}</span>
                        <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category?.label}
                      </p>
                    </div>
                    <Badge variant={status.status === 'good' ? 'default' : 'destructive'}>
                      {status.label}
                    </Badge>
                  </div>

                  {/* Quantity */}
                  <div className="text-center py-3 bg-accent rounded-lg">
                    <p className="text-xs text-muted-foreground">Current Stock</p>
                    <p className="text-2xl font-bold">
                      {item.currentQuantity} {item.unit}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {item.minQuantity} {item.unit}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item, -1)}
                      className="flex-1"
                    >
                      -1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item, 1)}
                      className="flex-1"
                    >
                      +1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item, 5)}
                      className="flex-1"
                    >
                      +5
                    </Button>
                  </div>

                  {/* Info */}
                  {item.avgPrice > 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      Avg. Price: ৳{item.avgPrice}/{item.unit}
                    </p>
                  )}

                  {item.expiryDate && (
                    <p className="text-xs text-center text-orange-600">
                      Expires: {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={14} />}
                      onClick={() => handleEdit(item)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Items Found</h3>
          <p className="text-muted-foreground mb-4">
            {filter !== 'all' 
              ? `No items in ${filter} stock`
              : 'Start tracking your household inventory'}
          </p>
          {filter === 'all' && (
            <Button onClick={() => setShowAddModal(true)}>Add First Item</Button>
          )}
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={editingItem ? 'Edit Item' : 'Add Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Rice, Milk, Soap"
            required
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            options={INVENTORY_CATEGORIES.map(cat => ({
              value: cat.id,
              label: `${cat.emoji} ${cat.label}`
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Current Quantity"
              type="number"
              step="0.01"
              min="0"
              value={formData.currentQuantity}
              onChange={(e) => setFormData(prev => ({ ...prev, currentQuantity: e.target.value }))}
              required
            />

            <Input
              label="Min Quantity"
              type="number"
              step="0.01"
              min="0"
              value={formData.minQuantity}
              onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              options={INVENTORY_UNITS}
            />

            <Input
              label="Avg. Price (৳)"
              type="number"
              step="0.01"
              min="0"
              value={formData.avgPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, avgPrice: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          <Input
            label="Expiry Date (Optional)"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Shopping List Modal */}
      <Modal
        isOpen={showShoppingList}
        onClose={() => setShowShoppingList(false)}
        title="Shopping List"
      >
        <div className="space-y-3">
          {shoppingList.length > 0 ? (
            <>
              {shoppingList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-border rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Need: {item.neededQuantity} {item.unit}
                    </p>
                    {item.estimatedCost > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Est. Cost: ৳{item.estimatedCost.toFixed(0)}
                      </p>
                    )}
                  </div>
                  <Badge variant={item.priority === 'high' ? 'destructive' : 'default'}>
                    {item.priority}
                  </Badge>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <p className="text-sm font-medium">
                  Total Estimated Cost: ৳{shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0).toFixed(0)}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
              <p>No items needed. All stocked up!</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InventoryManager;

