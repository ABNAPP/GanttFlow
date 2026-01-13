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

export const useNotes = (user) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setNotes([]);
      return;
    }

    setLoading(true);

    // For demo mode, use localStorage
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) {
        setLoading(false);
        setNotes([]);
        return;
      }
      try {
        const stored = localStorage.getItem('notes');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Ensure all notes have required fields
          const notesWithDefaults = (parsed || []).map(note => {
            if (!note || !note.id) return null;
            return {
              ...note,
              text: note.text || '',
              createdAt: note.createdAt || new Date().toISOString(),
            };
          }).filter(note => note !== null);
          setNotes(notesWithDefaults);
        } else {
          setNotes([]);
        }
        setLoading(false);
      } catch (e) {
        console.error('Error loading notes from localStorage:', e);
        setNotes([]);
        setLoading(false);
      }
      return;
    }

    // Real Firebase mode - use same appId structure as tasks
    const notesRef = doc(db, 'artifacts', appId, 'users', user.uid, 'notes', 'items');
    
    const unsubscribe = onSnapshot(
      notesRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.data();
            // Ensure all notes have required fields
            const notesWithDefaults = (data.notes || []).map(note => {
              if (!note || !note.id) return null;
              return {
                ...note,
                text: note.text || '',
                createdAt: note.createdAt || new Date().toISOString(),
              };
            }).filter(note => note !== null);
            
            // Only update if snapshot has same or more notes (avoid overwriting optimistic updates)
            setNotes(prevNotes => {
              if (notesWithDefaults.length >= prevNotes.length) {
                return notesWithDefaults;
              }
              return prevNotes;
            });
          } else {
            setNotes(prevNotes => {
              if (prevNotes.length > 0) {
                return prevNotes;
              }
              return [];
            });
          }
          setLoading(false);
        } catch (e) {
          console.error('Error processing notes snapshot:', e);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Firestore notes listener error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const addNote = async (text) => {
    if (!text || !text.trim()) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    const newNote = {
      id: generateId(),
      text: trimmedText,
      createdAt: new Date().toISOString(),
    };

    if (!user) return;

    // Optimistic update: update state immediately
    setNotes(prevNotes => {
      const updated = [...prevNotes, newNote];
      
      // Demo mode
      if (user.uid && user.uid.startsWith('demo-user-')) {
        if (!isDemoModeAllowed()) return prevNotes;
        try {
          localStorage.setItem('notes', JSON.stringify(updated));
        } catch (e) {
          console.error('Error saving notes to localStorage:', e);
          return prevNotes;
        }
        return updated;
      }

      // Firebase mode - save in background
      const notesRef = doc(db, 'artifacts', appId, 'users', user.uid, 'notes', 'items');
      const safePayload = sanitizeForFirestore_({ notes: updated });
      setDoc(notesRef, safePayload, { merge: true })
        .then(() => {
          console.log('[useNotes] addNote saved to Firebase', { count: updated.length });
        })
        .catch(error => {
          console.error('Error adding note to Firebase:', error);
          // On error, revert to previous state
          setNotes(prevNotes);
        });

      return updated;
    });
  };

  const deleteNote = async (id) => {
    if (!user || !id) return;

    const updated = notes.filter((note) => note.id !== id);

    // Demo mode
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) return;
      try {
        localStorage.setItem('notes', JSON.stringify(updated));
        setNotes(updated);
      } catch (e) {
        console.error('Error saving notes to localStorage:', e);
      }
      return;
    }

    // Firebase mode
    try {
      const notesRef = doc(db, 'artifacts', appId, 'users', user.uid, 'notes', 'items');
      const safePayload = sanitizeForFirestore_({ notes: updated });
      await setDoc(notesRef, safePayload, { merge: true });
      setNotes(updated);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const updateNote = async (id, text) => {
    if (!user || !id || !text || !text.trim()) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    const updated = notes.map((note) => {
      if (!note || !note.id) return note;
      if (note.id !== id) return note;
      return { 
        ...note, 
        text: trimmedText,
      };
    });

    // Demo mode
    if (user.uid && user.uid.startsWith('demo-user-')) {
      if (!isDemoModeAllowed()) return;
      try {
        localStorage.setItem('notes', JSON.stringify(updated));
        setNotes(updated);
      } catch (e) {
        console.error('Error saving notes to localStorage:', e);
      }
      return;
    }

    // Firebase mode
    try {
      const notesRef = doc(db, 'artifacts', appId, 'users', user.uid, 'notes', 'items');
      const safePayload = sanitizeForFirestore_({ notes: updated });
      await setDoc(notesRef, safePayload, { merge: true });
      setNotes(updated);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // Filter out deleted notes and sort by creation date (newest first)
  const activeNotes = notes.filter((note) => !note.deleted);
  const sortedNotes = [...activeNotes].sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return {
    notes: sortedNotes,
    loading,
    addNote,
    deleteNote,
    updateNote,
  };
};
