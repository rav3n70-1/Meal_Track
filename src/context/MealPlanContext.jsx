import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useHousehold } from './HouseholdContext';
import toast from 'react-hot-toast';

const MealPlanContext = createContext();

export const useMealPlan = () => {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
};

export const MealPlanProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { household } = useHousehold();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!household?.id) {
      setMeals([]);
      setLoading(false);
      return;
    }

    const mealsRef = collection(db, 'households', household.id, 'meals');
    
    const unsubscribe = onSnapshot(
      mealsRef,
      (snapshot) => {
        const mealsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMeals(mealsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching meals:", error);
        setLoading(false);
      }
    );

    setLoading(false);

    return () => unsubscribe();
  }, [household?.id]);

  const addMeal = async (mealData) => {
    if (!household) throw new Error('No household selected');
    if (!currentUser) throw new Error('Not authenticated');

    try {
      const mealsRef = collection(db, 'households', household.id, 'meals');
      await addDoc(mealsRef, {
        ...mealData,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Meal scheduled successfully');
    } catch (error) {
      console.error("Error adding meal:", error);
      toast.error('Failed to schedule meal');
      throw error;
    }
  };

  const updateMeal = async (mealId, updates) => {
    if (!household) throw new Error('No household selected');
    
    try {
      const mealRef = doc(db, 'households', household.id, 'meals', mealId);
      await updateDoc(mealRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      toast.success('Meal updated successfully');
    } catch (error) {
      console.error("Error updating meal:", error);
      toast.error('Failed to update meal');
      throw error;
    }
  };

  const deleteMeal = async (mealId) => {
    if (!household) throw new Error('No household selected');

    try {
      const mealRef = doc(db, 'households', household.id, 'meals', mealId);
      await deleteDoc(mealRef);
      toast.success('Meal removed from plan');
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error('Failed to remove meal');
      throw error;
    }
  };

  const value = {
    meals,
    loading,
    addMeal,
    updateMeal,
    deleteMeal
  };

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
};
