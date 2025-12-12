import { useState, useEffect } from 'react';
import { onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, isDemoModeAllowed, appId } from '../config/firebase';
import { generateId } from '../utils/helpers';

export const useQuickList = (user) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);

    // For demo mode, use localStorage
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        setLoading(false);
        setItems([]);
        return;
      }
      try {
        const stored = localStorage.getItem('quick-list');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Ensure all items have priority (backward compatibility)
          const itemsWithPriority = parsed.map(item => ({
            ...item,
            priority: item.priority || 'normal'
          }));
          setItems(itemsWithPriority);
        } else {
          setItems([]);
        }
        setLoading(false);
      } catch (e) {
        console.error('Error loading quick list from localStorage:', e);
        setItems([]);
        setLoading(false);
      }
      return;
    }

    // Real Firebase mode - use same appId structure as tasks
    const quickListRef = doc(db, 'artifacts', appId, 'users', user.uid, 'quickList', 'items');
    
    const unsubscribe = onSnapshot(
      quickListRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.data();
            // Ensure all items have priority (backward compatibility)
            const itemsWithPriority = (data.items || []).map(item => ({
              ...item,
              priority: item.priority || 'normal'
            }));
            setItems(itemsWithPriority);
          } else {
            setItems([]);
          }
          setLoading(false);
        } catch (e) {
          console.error('Error processing quick list snapshot:', e);
          setItems([]);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Firestore quick list listener error:', err);
        setItems([]);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const addItem = async (text, priority = 'normal') => {
    if (!text.trim()) return;

    const newItem = {
      id: generateId(),
      text: text.trim(),
      done: false,
      priority: priority || 'normal',
      createdAt: new Date().toISOString(),
    };

    if (!user) return;

    // Demo mode
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) return;
      try {
        const updated = [...items, newItem];
        localStorage.setItem('quick-list', JSON.stringify(updated));
        setItems(updated);
      } catch (e) {
        console.error('Error saving quick list to localStorage:', e);
      }
      return;
    }

    // Firebase mode
    try {
      const quickListRef = doc(db, 'artifacts', appId, 'users', user.uid, 'quickList', 'items');
      const updated = [...items, newItem];
      await setDoc(quickListRef, { items: updated }, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error adding quick list item:', error);
    }
  };

  const toggleItem = async (id) => {
    if (!user) return;

    const updated = items.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );

    // Demo mode
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) return;
      try {
        localStorage.setItem('quick-list', JSON.stringify(updated));
        setItems(updated);
      } catch (e) {
        console.error('Error saving quick list to localStorage:', e);
      }
      return;
    }

    // Firebase mode
    try {
      const quickListRef = doc(db, 'artifacts', appId, 'users', user.uid, 'quickList', 'items');
      await setDoc(quickListRef, { items: updated }, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error toggling quick list item:', error);
    }
  };

  const deleteItem = async (id) => {
    if (!user) return;

    const updated = items.filter((item) => item.id !== id);

    // Demo mode
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) return;
      try {
        localStorage.setItem('quick-list', JSON.stringify(updated));
        setItems(updated);
      } catch (e) {
        console.error('Error saving quick list to localStorage:', e);
      }
      return;
    }

    // Firebase mode
    try {
      const quickListRef = doc(db, 'artifacts', appId, 'users', user.uid, 'quickList', 'items');
      await setDoc(quickListRef, { items: updated }, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error deleting quick list item:', error);
    }
  };

  const updateItemPriority = async (id, priority) => {
    if (!user) return;

    const updated = items.map((item) =>
      item.id === id ? { ...item, priority: priority || 'normal' } : item
    );

    // Demo mode
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) return;
      try {
        localStorage.setItem('quick-list', JSON.stringify(updated));
        setItems(updated);
      } catch (e) {
        console.error('Error saving quick list to localStorage:', e);
      }
      return;
    }

    // Firebase mode
    try {
      const quickListRef = doc(db, 'artifacts', appId, 'users', user.uid, 'quickList', 'items');
      await setDoc(quickListRef, { items: updated }, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error updating quick list item priority:', error);
    }
  };

  // Sort items by priority: high > normal > low, then by creation date
  const priorityOrder = { high: 3, normal: 2, low: 1 };
  const sortedItems = [...items].sort((a, b) => {
    // First sort by priority (if not done)
    if (!a.done && !b.done) {
      const priorityDiff = (priorityOrder[b.priority || 'normal'] || 2) - (priorityOrder[a.priority || 'normal'] || 2);
      if (priorityDiff !== 0) return priorityDiff;
    }
    // Then by done status (not done first)
    if (a.done !== b.done) return a.done ? 1 : -1;
    // Finally by creation date (newest first)
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return { items: sortedItems, loading, addItem, toggleItem, deleteItem, updateItemPriority };
};

