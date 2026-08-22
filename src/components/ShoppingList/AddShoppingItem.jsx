import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import { db } from '../../firebase/config';
import Button from '../ui/Button';

const AddShoppingItem = ({ householdId, userId }) => {
  const [itemName, setItemName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !householdId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const listRef = collection(db, 'households', householdId, 'shoppingList');
      await addDoc(listRef, {
        name: itemName.trim(),
        completed: false,
        addedBy: userId,
        createdAt: serverTimestamp(),
      });
      setItemName('');
    } catch (error) {
      console.error('Error adding shopping item:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Add an item (e.g. Milk, Eggs)..."
          className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          disabled={isSubmitting}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!itemName.trim() || isSubmitting}
        className="py-3 whitespace-nowrap"
      >
        <Plus size={18} className="mr-2" />
        Add Item
      </Button>
    </form>
  );
};

export default AddShoppingItem;
