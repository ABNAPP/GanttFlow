import { useState, useEffect } from 'react';
import { onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, isDemoModeAllowed, appId } from '../config/firebase';
import { generateId } from '../utils/helpers';

/**
 * Sanitizes data for Firestore by removing undefined values
 * Firestore doesn't allow undefined values, so we remove them recursively
 * @param {any} data - Data to sanitize
 * @return {any} Sanitized data without undefined values
 */
const sanitizeForFirestore_ = (data) => {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return null;
  }
  
  // Handle arrays - sanitize each item and filter out nulls
  if (Array.isArray(data)) {
    return data
      .map(item => sanitizeForFirestore_(item))
      .filter(item => item !== null && item !== undefined);
  }
  
  // Handle plain objects - remove undefined values recursively
  if (typeof data === 'object' && data.constructor === Object) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip undefined values entirely
      if (value !== undefined) {
        const sanitizedValue = sanitizeForFirestore_(value);
        // Only add if sanitized value is not undefined
        if (sanitizedValue !== undefined && sanitizedValue !== null) {
          sanitized[key] = sanitizedValue;
        }
      }
    }
    return sanitized;
  }
  
  // Return primitives as-is
  return data;
};

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
          // Ensure all items have required fields (backward compatibility)
          const itemsWithPriority = (parsed || []).map(item => {
            if (!item || !item.id) return null;
            return {
              ...item,
              text: item.text || '',
              done: item.done === true,
              priority: item.priority || 'normal',
              type: (item.type && typeof item.type === 'string' && item.type.trim()) ? item.type.trim() : undefined,
              comment: (item.comment && typeof item.comment === 'string' && item.comment.trim()) ? item.comment.trim() : undefined,
              createdAt: item.createdAt || new Date().toISOString(),
            };
          }).filter(item => item !== null);
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
            // Ensure all items have required fields (backward compatibility)
            const itemsWithPriority = (data.items || []).map(item => {
              if (!item || !item.id) return null;
              return {
                ...item,
                text: item.text || '',
                done: item.done === true,
                priority: item.priority || 'normal',
                type: (item.type && typeof item.type === 'string' && item.type.trim()) ? item.type.trim() : undefined,
                comment: (item.comment && typeof item.comment === 'string' && item.comment.trim()) ? item.comment.trim() : undefined,
                createdAt: item.createdAt || new Date().toISOString(),
              };
            }).filter(item => item !== null);
            
            // Only update if snapshot has same or more items (avoid overwriting optimistic updates)
            setItems(prevItems => {
              // If snapshot has same or more items, use snapshot (it's the source of truth)
              // But if we have optimistic updates that aren't in snapshot yet, keep them temporarily
              if (itemsWithPriority.length >= prevItems.length) {
                console.log('[useQuickList] onSnapshot updating items', { 
                  snapshotCount: itemsWithPriority.length,
                  prevCount: prevItems.length 
                });
                return itemsWithPriority;
              }
              // Keep optimistic updates if snapshot is older (has fewer items)
              console.log('[useQuickList] onSnapshot keeping optimistic updates', { 
                snapshotCount: itemsWithPriority.length,
                prevCount: prevItems.length 
              });
              return prevItems;
            });
          } else {
            // Only set empty if we don't have optimistic updates
            setItems(prevItems => {
              if (prevItems.length > 0) {
                console.log('[useQuickList] onSnapshot keeping optimistic updates (no snapshot data)');
                return prevItems;
              }
              return [];
            });
          }
          setLoading(false);
        } catch (e) {
          console.error('Error processing quick list snapshot:', e);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Firestore quick list listener error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const addItem = async (text, priority = 'normal', type = '', comment = '') => {
    if (!text || !text.trim()) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    const newItem = {
      id: generateId(),
      text: trimmedText,
      done: false,
      priority: priority || 'normal',
      // Only include type/comment if they have values (will be removed by sanitize if undefined)
      ...(type && type.trim() ? { type: type.trim() } : {}),
      ...(comment && comment.trim() ? { comment: comment.trim() } : {}),
      createdAt: new Date().toISOString(),
    };

    if (!user) return;

    // Log before update
    console.log('[useQuickList] addItem called', { 
      text: trimmedText, 
      currentItemsCount: items.length,
      newItemId: newItem.id 
    });

    // Optimistic update: update state immediately
    setItems(prevItems => {
      const updated = [...prevItems, newItem];
      
      // Log after update
      console.log('[useQuickList] addItem optimistic update', { 
        prevCount: prevItems.length,
        newCount: updated.length,
        newItemId: newItem.id
      });
      
      // Demo mode
      if (user.uid && user.uid.startsWith('demo-user-')) {
        if (!isDemoModeAllowed()) return prevItems;
        try {
          localStorage.setItem('quick-list', JSON.stringify(updated));
          console.log('[useQuickList] addItem saved to localStorage', { count: updated.length });
        } catch (e) {
          console.error('Error saving quick list to localStorage:', e);
          return prevItems;
        }
        return updated;
      }

      // Firebase mode - save in background
      const quickListRef = doc(db, 'artifacts', appId, 'users', user.uid, 'quickList', 'items');
      const safePayload = sanitizeForFirestore_({ items: updated });
      setDoc(quickListRef, safePayload, { merge: true })
        .then(() => {
          console.log('[useQuickList] addItem saved to Firebase', { count: updated.length });
        })
        .catch(error => {
          console.error('Error adding quick list item to Firebase:', error);
          // On error, revert to previous state
          setItems(prevItems);
        });

      return updated;
    });
  };

  const toggleItem = async (id) => {
    if (!user || !id) return;

    const updated = items.map((item) => {
      if (!item || !item.id) return item;
      return item.id === id ? { ...item, done: !item.done } : item;
    });

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
      const safePayload = sanitizeForFirestore_({ items: updated });
      await setDoc(quickListRef, safePayload, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error toggling quick list item:', error);
    }
  };

  const deleteItem = async (id) => {
    if (!user || !id) return;

    // Soft delete - mark as deleted instead of removing
    const updated = items.map((item) => {
      if (!item || !item.id) return item;
      return item.id === id ? { ...item, deleted: true, deletedAt: new Date().toISOString() } : item;
    });

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
      const safePayload = sanitizeForFirestore_({ items: updated });
      await setDoc(quickListRef, safePayload, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error deleting quick list item:', error);
    }
  };

  const archiveItem = async (id) => {
    if (!user || !id) return;

    const updated = items.map((item) => {
      if (!item || !item.id) return item;
      return item.id === id ? { ...item, archived: true, archivedAt: new Date().toISOString() } : item;
    });

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
      const safePayload = sanitizeForFirestore_({ items: updated });
      await setDoc(quickListRef, safePayload, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error archiving quick list item:', error);
    }
  };

  const restoreItem = async (id) => {
    if (!user) return;

    const updated = items.map((item) =>
      item.id === id ? { ...item, archived: false, archivedAt: null, deleted: false, deletedAt: null } : item
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
      const safePayload = sanitizeForFirestore_({ items: updated });
      await setDoc(quickListRef, safePayload, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error restoring quick list item:', error);
    }
  };

  const permanentDeleteItem = async (id) => {
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
      const safePayload = sanitizeForFirestore_({ items: updated });
      await setDoc(quickListRef, safePayload, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error permanently deleting quick list item:', error);
    }
  };

  const updateItemText = async (id, text, priority, type = '', comment = '') => {
    if (!user || !id || !text || !text.trim()) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    const updated = items.map((item) => {
      if (!item || !item.id) return item;
      if (item.id !== id) return item;
      const updatedItem = { 
        ...item, 
        text: trimmedText, 
        priority: priority || item.priority || 'normal',
      };
      // Only include type/comment if they have values (sanitize will remove undefined)
      if (type && type.trim()) {
        updatedItem.type = type.trim();
      }
      if (comment && comment.trim()) {
        updatedItem.comment = comment.trim();
      }
      return updatedItem;
    });

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
      const safePayload = sanitizeForFirestore_({ items: updated });
      await setDoc(quickListRef, safePayload, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error updating quick list item text:', error);
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
      const safePayload = sanitizeForFirestore_({ items: updated });
      await setDoc(quickListRef, safePayload, { merge: true });
      setItems(updated);
    } catch (error) {
      console.error('Error updating quick list item priority:', error);
    }
  };

  // Filter items: active (not archived, not deleted), archived, deleted
  const activeItems = items.filter((item) => !item.archived && !item.deleted);
  const archivedItems = items.filter((item) => item.archived && !item.deleted);
  const deletedItems = items.filter((item) => item.deleted);

  // Sort active items by priority: high > normal > low, then by creation date
  const priorityOrder = { high: 3, normal: 2, low: 1 };
  const sortedActiveItems = [...activeItems].sort((a, b) => {
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

  // Sort archived items by archived date (newest first)
  const sortedArchivedItems = [...archivedItems].sort((a, b) => {
    return new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0);
  });

  // Sort deleted items by deleted date (newest first)
  const sortedDeletedItems = [...deletedItems].sort((a, b) => {
    return new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0);
  });

  return {
    items: sortedActiveItems,
    archivedItems: sortedArchivedItems,
    deletedItems: sortedDeletedItems,
    loading,
    addItem,
    toggleItem,
    deleteItem,
    archiveItem,
    restoreItem,
    permanentDeleteItem,
    updateItemPriority,
    updateItemText,
  };
};

