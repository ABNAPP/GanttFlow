/**
 * Hook for managing task filters and saved views
 * Extracted from App.jsx filter logic
 */
import { useState, useCallback, useMemo } from 'react';

/**
 * @param {import('../types').Task[]} tasks - All tasks
 * @param {string} lang - Current language
 * @returns {import('../types').TaskFilters}
 */
export const useTaskFilters = (tasks, lang) => {
  const [filters, setFilters] = useState({
    client: null,
    phase: null,
    status: null,
    roles: [],
    tags: [],
  });

  const [savedViews, setSavedViews] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('gantt-saved-views');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Error loading saved views:', error);
      return [];
    }
  });

  // Persist saved views to localStorage
  const updateSavedViews = useCallback((newViews) => {
    setSavedViews(newViews);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gantt-saved-views', JSON.stringify(newViews));
      } catch (error) {
        console.warn('Error saving views to localStorage:', error);
      }
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      client: null,
      phase: null,
      status: null,
      roles: [],
      tags: [],
    });
  }, []);

  const saveView = useCallback((view) => {
    const newViews = [...savedViews, view];
    updateSavedViews(newViews);
  }, [savedViews, updateSavedViews]);

  const loadView = useCallback((viewName) => {
    const view = savedViews.find(v => v.name === viewName);
    if (view) {
      setFilters(view.filters || {
        client: null,
        phase: null,
        status: null,
        roles: [],
        tags: [],
      });
      return view.zoomLevel;
    }
    return null;
  }, [savedViews]);

  const deleteView = useCallback((viewName) => {
    const newViews = savedViews.filter(v => v.name !== viewName);
    updateSavedViews(newViews);
  }, [savedViews, updateSavedViews]);

  // Get unique values for filter dropdowns (memoized)
  const filterOptions = useMemo(() => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        clients: [],
        phases: [],
        tags: [],
      };
    }

    const clients = [...new Set(tasks.map(t => t.client).filter(Boolean))].sort();
    const phases = [...new Set(tasks.map(t => t.phase).filter(Boolean))].sort();
    const tags = [...new Set(tasks.flatMap(t => (t.tags || [])).filter(Boolean))].sort();

    return { clients, phases, tags };
  }, [tasks]);

  return {
    filters,
    setFilters,
    clearFilters,
    savedViews,
    saveView,
    loadView,
    deleteView,
    filterOptions,
  };
};

