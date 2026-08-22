import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, CheckCircle, Circle, Trash2, Loader2, ListTodo, Receipt, Package } from 'lucide-react';
import { db } from '../firebase/config';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../context/PantryContext';
import AddShoppingItem from '../components/ShoppingList/AddShoppingItem';
import ShoppingListItem from '../components/ShoppingList/ShoppingListItem';
import Button from '../components/ui/Button';
import Layout from '../components/Layout/Layout';
import Modal from '../components/ui/Modal';
import ExpenseForm from '../components/Expenses/ExpenseForm';

import PantryItemForm from '../components/Pantry/PantryItemForm';

const ShoppingList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPantryPromptOpen, setIsPantryPromptOpen] = useState(false);
  const [isPantryFormOpen, setIsPantryFormOpen] = useState(false);
  const [completedItemsForPantry, setCompletedItemsForPantry] = useState([]);

  const { household } = useHousehold();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (!household?.id) {
      setLoading(false);
      return;
    }

    const listRef = collection(db, 'households', household.id, 'shoppingList');
    const q = query(listRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(listData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching shopping list:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [household?.id]);

  const deleteCompletedItemsFromDb = async () => {
    const completedItems = items.filter(item => item.completed);
    if (completedItems.length === 0 || !household?.id) return;

    try {
      const batch = writeBatch(db);
      completedItems.forEach(item => {
        const itemRef = doc(db, 'households', household.id, 'shoppingList', item.id);
        batch.delete(itemRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting completed items:', error);
    }
  };

  const clearCompleted = async () => {
    const completedItems = items.filter(item => item.completed);
    if (completedItems.length === 0 || !household?.id) return;
    
    // Check if user confirms
    if (!window.confirm(`Are you sure you want to remove ${completedItems.length} completed item(s)?`)) {
      return;
    }
    
    await deleteCompletedItemsFromDb();
  };

  const handleExpenseSuccess = async () => {
    setIsExpenseModalOpen(false);
    const completed = items.filter(item => item.completed);
    setCompletedItemsForPantry(completed);
    
    // Prompt user to send to pantry or skip
    setIsPantryPromptOpen(true);
  };

  const handlePromptSkip = async () => {
    setIsPantryPromptOpen(false);
    await deleteCompletedItemsFromDb();
  };

  const handlePromptSendToPantry = () => {
    setIsPantryPromptOpen(false);
    setIsPantryFormOpen(true);
  };

  const handlePantryFormClose = async () => {
    setIsPantryFormOpen(false);
    await deleteCompletedItemsFromDb();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  const pendingItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="text-primary" />
            Shopping List
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Keep track of what you need to buy for the household.
          </p>
        </div>
        
        {completedItems.length > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsExpenseModalOpen(true)}
              className="text-primary hover:bg-primary/10 border-primary"
            >
              <Receipt size={16} className="mr-2" />
              Convert to Expense
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCompleted}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={16} className="mr-2" />
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
        <AddShoppingItem householdId={household?.id} userId={currentUser?.uid} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center justify-between border-b border-border pb-2">
            <span>To Buy</span>
            <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
              {pendingItems.length}
            </span>
          </h2>
          
          <div className="space-y-2">
            <AnimatePresence>
              {pendingItems.length > 0 ? (
                pendingItems.map(item => (
                  <ShoppingListItem 
                    key={item.id} 
                    item={item} 
                    householdId={household?.id} 
                  />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground bg-accent/50 rounded-xl border border-dashed border-border"
                >
                  <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-20" />
                  <p>No items to buy.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Completed Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center justify-between border-b border-border pb-2 opacity-70">
            <span>Completed</span>
            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
              {completedItems.length}
            </span>
          </h2>
          
          <div className="space-y-2 opacity-70">
            <AnimatePresence>
              {completedItems.length > 0 ? (
                completedItems.map(item => (
                  <ShoppingListItem 
                    key={item.id} 
                    item={item} 
                    householdId={household?.id} 
                  />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground bg-accent/30 rounded-xl border border-dashed border-border/50"
                >
                  <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-20" />
                  <p>No completed items.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </div>
      </div>
      
      {/* Create Expense Modal */}
      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)}
        title="Create Expense from Shopping List"
      >
        <ExpenseForm 
          expense={{ 
            items: [{
              name: 'Batch Grocery Purchase', 
              amount: '', 
              buyer: currentUser?.uid || '' 
            }],
            notes: 'Purchased items:\n' + completedItems.map(item => '- ' + item.name).join('\n')
          }}
          onSuccess={handleExpenseSuccess}
          onCancel={() => setIsExpenseModalOpen(false)}
        />
      </Modal>

      {/* Prompt Modal: Add to Pantry? */}
      <Modal
        isOpen={isPantryPromptOpen}
        onClose={handlePromptSkip}
        title="Add Purchased Items to Pantry?"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-emerald-500/10 p-3 rounded-lg text-emerald-600 border border-emerald-500/20">
            <Package size={24} className="shrink-0" />
            <div>
              <p className="font-semibold text-sm">Expense Saved Successfully!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Would you like to add these {completedItemsForPantry.length} item(s) to your Pantry inventory?
              </p>
            </div>
          </div>

          <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-muted-foreground mb-1">Purchased Items:</p>
            {completedItemsForPantry.map((item, idx) => (
              <p key={idx} className="text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {item.name}
              </p>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handlePromptSkip}>
              Skip / No Thanks
            </Button>
            <Button onClick={handlePromptSendToPantry} icon={<Package size={16} />}>
              Yes, Open Pantry Form
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pantry Form Modal */}
      {isPantryFormOpen && (
        <PantryItemForm
          isOpen={isPantryFormOpen}
          onClose={handlePantryFormClose}
          existingItem={{
            name: completedItemsForPantry.map(i => i.name).join(', ')
          }}
        />
      )}
    </Layout>
  );
};

export default ShoppingList;
