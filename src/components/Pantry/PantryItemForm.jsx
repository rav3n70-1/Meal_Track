import React, { useState, useEffect } from 'react';
import { usePantry } from '../../context/PantryContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Dry Goods & Grains',
  'Beverages',
  'Snacks',
  'Frozen',
  'Spices & Condiments',
  'Other'
];

const UNITS = ['pcs', 'kg', 'g', 'lbs', 'oz', 'liters', 'ml', 'packs', 'cans', 'bottles', 'boxes'];

const PantryItemForm = ({ isOpen, onClose, existingItem }) => {
  const { addPantryItem, updatePantryItem } = usePantry();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Dry Goods & Grains',
    quantity: 1,
    unit: 'pcs',
    minQuantity: 1,
    expiryDate: '',
    notes: ''
  });

  useEffect(() => {
    if (existingItem) {
      setFormData({
        name: existingItem.name || '',
        category: existingItem.category || 'Dry Goods & Grains',
        quantity: existingItem.quantity ?? 1,
        unit: existingItem.unit || 'pcs',
        minQuantity: existingItem.minQuantity ?? 1,
        expiryDate: existingItem.expiryDate || '',
        notes: existingItem.notes || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Dry Goods & Grains',
        quantity: 1,
        unit: 'pcs',
        minQuantity: 1,
        expiryDate: '',
        notes: ''
      });
    }
  }, [existingItem, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    setLoading(true);
    try {
      if (existingItem) {
        await updatePantryItem(existingItem.id, {
          ...formData,
          name: formData.name.trim(),
          notes: formData.notes.trim()
        });
      } else {
        await addPantryItem({
          ...formData,
          name: formData.name.trim(),
          notes: formData.notes.trim()
        });
      }
      onClose();
    } catch (error) {
      // Error toast in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingItem ? 'Edit Pantry Item' : 'Add Item to Pantry'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Item Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g. Olive Oil, Whole Milk, Rice"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {UNITS.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Current Quantity"
            type="number"
            name="quantity"
            min="0"
            step="any"
            value={formData.quantity}
            onChange={handleChange}
            required
          />

          <Input
            label="Min Threshold (Low Stock)"
            type="number"
            name="minQuantity"
            min="0"
            step="any"
            value={formData.minQuantity}
            onChange={handleChange}
            placeholder="1"
          />
        </div>

        <Input
          label="Expiry Date (Optional)"
          type="date"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleChange}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. Brand preference, location in cupboard..."
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (existingItem ? 'Save Changes' : 'Add Item')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PantryItemForm;
