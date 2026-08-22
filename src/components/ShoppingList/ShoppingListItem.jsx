import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Trash2, Loader2, User } from 'lucide-react';
import { db } from '../../firebase/config';

const ShoppingListItem = ({ item, householdId }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleComplete = async () => {
    if (!householdId || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const itemRef = doc(db, 'households', householdId, 'shoppingList', item.id);
      await updateDoc(itemRef, {
        completed: !item.completed
      });
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteItem = async (e) => {
    e.stopPropagation();
    if (!householdId || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const itemRef = doc(db, 'households', householdId, 'shoppingList', item.id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error deleting item:', error);
      setIsUpdating(false); // Only set false on error, as successful delete removes component
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={`group flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all cursor-pointer ${
        item.completed 
          ? 'bg-muted/30 border-transparent' 
          : 'bg-card border-border hover:border-primary/30 hover:shadow-sm'
      }`}
      onClick={toggleComplete}
    >
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        <button 
          className={`flex-shrink-0 flex items-center justify-center transition-colors ${
            item.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          }`}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 size={24} className="animate-spin text-primary" />
          ) : item.completed ? (
            <CheckCircle size={24} className="text-primary fill-primary/20" />
          ) : (
            <Circle size={24} />
          )}
        </button>
        
        <div className="flex flex-col min-w-0">
          <span className={`text-base md:text-lg font-medium truncate transition-all ${
            item.completed ? 'text-muted-foreground line-through' : 'text-foreground'
          }`}>
            {item.name}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <User size={12} />
            <span className="truncate max-w-[120px]">
              Added by member
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={deleteItem}
        disabled={isUpdating}
        className={`p-2 rounded-lg text-muted-foreground transition-all flex-shrink-0 ${
          item.completed 
            ? 'hover:bg-destructive/10 hover:text-destructive' 
            : 'opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive/10 hover:text-destructive'
        }`}
        aria-label="Delete item"
      >
        <Trash2 size={18} />
      </button>
    </motion.div>
  );
};

export default ShoppingListItem;
