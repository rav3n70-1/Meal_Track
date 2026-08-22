import React, { useState, useMemo } from 'react';
import { format, parseISO, differenceInDays, isBefore, startOfToday } from 'date-fns';
import { Package, Plus, Search, AlertTriangle, Clock, ShoppingCart, Edit, Trash2, Minus, Check } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { usePantry } from '../context/PantryContext';
import PantryItemForm from '../components/Pantry/PantryItemForm';

const Pantry = () => {
  const { pantryItems, updatePantryItem, deletePantryItem, addToShoppingList, loading } = usePantry();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'low_stock', 'expiring'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(pantryItems.map(i => i.category || 'Other'));
    return ['All', ...Array.from(cats)];
  }, [pantryItems]);

  // Low stock & expiring metrics
  const lowStockItems = useMemo(() => {
    return pantryItems.filter(item => item.quantity <= (item.minQuantity ?? 1));
  }, [pantryItems]);

  const expiringItems = useMemo(() => {
    const today = startOfToday();
    return pantryItems.filter(item => {
      if (!item.expiryDate) return false;
      const exp = parseISO(item.expiryDate);
      const days = differenceInDays(exp, today);
      return days <= 3; // Expired or expiring within 3 days
    });
  }, [pantryItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return pantryItems.filter(item => {
      // Tab filter
      if (activeTab === 'low_stock' && item.quantity > (item.minQuantity ?? 1)) return false;
      if (activeTab === 'expiring') {
        if (!item.expiryDate) return false;
        const exp = parseISO(item.expiryDate);
        if (differenceInDays(exp, startOfToday()) > 3) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

      // Search term
      if (searchTerm.trim() && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      return true;
    });
  }, [pantryItems, activeTab, selectedCategory, searchTerm]);

  const handleAddClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (itemId) => {
    if (window.confirm('Are you sure you want to remove this item from your pantry?')) {
      deletePantryItem(itemId);
    }
  };

  const handleQuantityChange = (item, delta) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    updatePantryItem(item.id, { quantity: newQty });
  };

  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return null;
    const today = startOfToday();
    const exp = parseISO(expiryDate);
    const days = differenceInDays(exp, today);

    if (isBefore(exp, today)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
          <AlertTriangle size={12} /> Expired ({format(exp, 'MMM d')})
        </span>
      );
    }
    if (days <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Clock size={12} /> Expires in {days === 0 ? 'today' : `${days}d`}
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        Exp: {format(exp, 'MMM d, yyyy')}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-8">
          <div className="animate-pulse text-primary font-medium">Loading Pantry Inventory...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="text-primary" />
              Pantry & Inventory
            </h1>
            <p className="text-muted-foreground text-sm">Track ingredients, expiration dates, and low stock</p>
          </div>
          <Button onClick={handleAddClick} icon={<Plus size={18} />}>
            Add Item
          </Button>
        </div>

        {/* Overview Badges & Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'all' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-card border border-border text-foreground hover:bg-accent'
            }`}
          >
            All Items ({pantryItems.length})
          </button>
          <button
            onClick={() => setActiveTab('low_stock')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'low_stock' 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'bg-card border border-border text-foreground hover:bg-accent'
            }`}
          >
            <AlertTriangle size={14} className={activeTab === 'low_stock' ? '' : 'text-amber-500'} />
            Low Stock ({lowStockItems.length})
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'expiring' 
                ? 'bg-red-500 text-white shadow-sm' 
                : 'bg-card border border-border text-foreground hover:bg-accent'
            }`}
          >
            <Clock size={14} className={activeTab === 'expiring' ? '' : 'text-red-500'} />
            Expiring Soon ({expiringItems.length})
          </button>
        </div>

        {/* Controls: Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search pantry items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Inventory Cards */}
        {filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(item => {
              const isLowStock = item.quantity <= (item.minQuantity ?? 1);

              return (
                <div 
                  key={item.id}
                  className={`bg-card border rounded-xl p-4 shadow-sm relative group flex flex-col justify-between transition-all hover:border-primary/50 ${
                    isLowStock ? 'border-amber-500/40 bg-amber-500/5' : 'border-border'
                  }`}
                >
                  <div>
                    {/* Header: Name & Category */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {item.category || 'Other'}
                        </span>
                        <h3 className="font-bold text-foreground text-lg leading-tight">
                          {item.name}
                        </h3>
                      </div>
                      
                      {/* Action icons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-accent"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-1 text-muted-foreground hover:text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    {item.expiryDate && (
                      <div className="mb-3">
                        {getExpiryBadge(item.expiryDate)}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Footer: Quantity Controls & Quick Restock */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
                      <button
                        onClick={() => handleQuantityChange(item, -1)}
                        className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold px-1 min-w-[3rem] text-center">
                        {item.quantity} <span className="text-xs font-normal text-muted-foreground">{item.unit || 'pcs'}</span>
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item, 1)}
                        className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Low stock restock button */}
                    {isLowStock ? (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => addToShoppingList(item)}
                        className="text-amber-600 border-amber-500/40 hover:bg-amber-500/10 text-xs"
                      >
                        <ShoppingCart size={12} className="mr-1" /> Restock
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-foreground">No pantry items found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || selectedCategory !== 'All' 
                ? 'Try adjusting your search or category filter.' 
                : 'Click "Add Item" to start tracking your inventory.'}
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <PantryItemForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          existingItem={editingItem}
        />
      )}
    </Layout>
  );
};

export default Pantry;
