import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useHousehold } from './HouseholdContext';
import toast from 'react-hot-toast';

const PantryContext = createContext();

export const usePantry = () => {
  const context = useContext(PantryContext);
  if (!context) {
    throw new Error('usePantry must be used within a PantryProvider');
  }
  return context;
};

export const PantryProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { household } = useHousehold();
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!household?.id) {
      setPantryItems([]);
      setLoading(false);
      return;
    }

    const pantryRef = collection(db, 'households', household.id, 'pantry');
    
    const unsubscribe = onSnapshot(
      pantryRef,
      (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPantryItems(itemsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching pantry items:", error);
        setLoading(false);
      }
    );

    setLoading(false);

    return () => unsubscribe();
  }, [household?.id]);

  const addPantryItem = async (itemData) => {
    if (!household?.id) throw new Error('No household selected');
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const pantryRef = collection(db, 'households', household.id, 'pantry');
      const cleanedData = { ...itemData };
      delete cleanedData.id;
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) delete cleanedData[key];
      });

      await addDoc(pantryRef, {
        ...cleanedData,
        quantity: Number(cleanedData.quantity) || 1,
        minQuantity: Number(cleanedData.minQuantity) || 0,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Pantry item added');
    } catch (error) {
      console.error("Error adding pantry item:", error);
      toast.error('Failed to add pantry item');
      throw error;
    }
  };

  const updatePantryItem = async (itemId, updates) => {
    if (!household?.id) throw new Error('No household selected');
    if (!itemId) throw new Error('No item ID provided');
    
    try {
      const itemRef = doc(db, 'households', household.id, 'pantry', itemId);
      const cleanedUpdates = { ...updates };
      delete cleanedUpdates.id;
      Object.keys(cleanedUpdates).forEach(key => {
        if (cleanedUpdates[key] === undefined) delete cleanedUpdates[key];
      });

      if (cleanedUpdates.quantity !== undefined) {
        cleanedUpdates.quantity = Number(cleanedUpdates.quantity) || 0;
      }
      if (cleanedUpdates.minQuantity !== undefined) {
        cleanedUpdates.minQuantity = Number(cleanedUpdates.minQuantity) || 0;
      }

      await updateDoc(itemRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp()
      });
      toast.success('Pantry item updated');
    } catch (error) {
      console.error("Error updating pantry item:", error);
      toast.error('Failed to update pantry item');
      throw error;
    }
  };

  const deletePantryItem = async (itemId) => {
    if (!household?.id) throw new Error('No household selected');
    if (!itemId) throw new Error('No item ID provided');

    try {
      const itemRef = doc(db, 'households', household.id, 'pantry', itemId);
      await deleteDoc(itemRef);
      toast.success('Pantry item removed');
    } catch (error) {
      console.error("Error deleting pantry item:", error);
      toast.error('Failed to remove pantry item');
      throw error;
    }
  };

  // Move items from completed Shopping List to Pantry
  const addItemsFromShoppingList = async (items) => {
    if (!household || !currentUser || !items.length) return;

    try {
      const batch = writeBatch(db);
      const pantryRef = collection(db, 'households', household.id, 'pantry');

      items.forEach(item => {
        const newDocRef = doc(pantryRef);
        batch.set(newDocRef, {
          name: item.name || 'Shopping Item',
          quantity: 1,
          unit: 'pcs',
          category: 'Other',
          minQuantity: 1,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      toast.success(`Added ${items.length} item(s) to Pantry`);
    } catch (error) {
      console.error("Error adding items from shopping list:", error);
      toast.error('Failed to move items to pantry');
      throw error;
    }
  };

  // Quick action: Add low-stock pantry item back to Shopping List
  const addToShoppingList = async (pantryItem) => {
    if (!household || !currentUser) return;

    try {
      const shoppingRef = collection(db, 'households', household.id, 'shoppingList');
      await addDoc(shoppingRef, {
        name: `${pantryItem.name} (${pantryItem.quantity} ${pantryItem.unit || ''})`,
        completed: false,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      toast.success(`Added "${pantryItem.name}" to Shopping List`);
    } catch (error) {
      console.error("Error adding pantry item to shopping list:", error);
      toast.error('Failed to add to shopping list');
      throw error;
    }
  };

  const value = {
    pantryItems,
    loading,
    addPantryItem,
    updatePantryItem,
    deletePantryItem,
    addItemsFromShoppingList,
    addToShoppingList
  };

  return (
    <PantryContext.Provider value={value}>
      {children}
    </PantryContext.Provider>
  );
};
