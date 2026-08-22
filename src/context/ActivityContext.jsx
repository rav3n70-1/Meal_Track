import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useHousehold } from './HouseholdContext';

const ActivityContext = createContext();

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { household } = useHousehold();
  
  const [activities, setActivities] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to activities and notices when household changes
  useEffect(() => {
    if (!household?.id) {
      setActivities([]);
      setNotices([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen to activities (limit to 100 most recent for performance)
    const activitiesRef = collection(db, 'households', household.id, 'activities');
    const qActivities = query(activitiesRef, orderBy('timestamp', 'desc'), limit(100));
    
    const unsubscribeActivities = onSnapshot(qActivities, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activitiesData);
    }, (error) => {
      console.error('Error fetching activities:', error);
    });

    // Listen to notices
    const noticesRef = collection(db, 'households', household.id, 'notices');
    const qNotices = query(noticesRef, orderBy('createdAt', 'desc'));

    const unsubscribeNotices = onSnapshot(qNotices, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotices(noticesData);
    }, (error) => {
      console.error('Error fetching notices:', error);
    });

    setLoading(false);

    return () => {
      unsubscribeActivities();
      unsubscribeNotices();
    };
  }, [household?.id]);

  /**
   * Log an activity to the timeline
   * @param {string} type - e.g., 'expense_added', 'expense_approved', 'member_joined'
   * @param {string} description - Human readable description
   * @param {object} metadata - Optional extra data (e.g., amount, itemId)
   */
  const logActivity = async (type, description, metadata = {}) => {
    if (!household?.id || !currentUser) return;
    
    try {
      const activitiesRef = collection(db, 'households', household.id, 'activities');
      await addDoc(activitiesRef, {
        type,
        description,
        metadata,
        actorUid: currentUser.uid,
        actorName: currentUser.displayName || 'Someone',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  /**
   * Add a new notice to the board
   * @param {string} title - Notice title
   * @param {string} content - Notice content
   */
  const addNotice = async (title, content) => {
    if (!household?.id || !currentUser) return;

    try {
      const noticesRef = collection(db, 'households', household.id, 'notices');
      await addDoc(noticesRef, {
        title,
        content,
        authorUid: currentUser.uid,
        authorName: currentUser.displayName || 'Manager',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to add notice:', error);
      throw error;
    }
  };

  /**
   * Delete a notice from the board
   * @param {string} noticeId 
   */
  const removeNotice = async (noticeId) => {
    if (!household?.id) return;

    try {
      const noticeRef = doc(db, 'households', household.id, 'notices', noticeId);
      await deleteDoc(noticeRef);
    } catch (error) {
      console.error('Failed to remove notice:', error);
      throw error;
    }
  };

  const value = {
    activities,
    notices,
    loading,
    logActivity,
    addNotice,
    removeNotice
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};
