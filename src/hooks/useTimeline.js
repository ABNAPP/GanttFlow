/**
 * Hook for Gantt timeline calculations
 * Handles date ranges, zoom levels, and cell width calculations
 */
import { useState, useMemo, useCallback } from 'react';
import { getDaysArray } from '../utils/helpers';
import { DEFAULT_VIEW_DAYS, ZOOM_LEVELS } from '../constants';

/**
 * @param {import('../types').Task[]} tasks - All tasks
 * @param {string} defaultZoom - Default zoom level
 * @returns {Object} Timeline configuration and utilities
 */
export const useTimeline = (tasks, defaultZoom = 'week') => {
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);
  const [viewStart, setViewStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [viewDays, setViewDays] = useState(DEFAULT_VIEW_DAYS);

  // Calculate view end date
  const viewEnd = useMemo(() => {
    const end = new Date(viewStart);
    end.setDate(end.getDate() + viewDays);
    return end;
  }, [viewStart, viewDays]);

  // Get current zoom configuration
  const zoomConfig = useMemo(() => {
    return ZOOM_LEVELS[zoomLevel] || ZOOM_LEVELS.week;
  }, [zoomLevel]);

  // Calculate cell width based on zoom
  const cellWidth = useMemo(() => {
    return zoomConfig.cellWidth;
  }, [zoomConfig]);

  // Get days array for timeline
  const days = useMemo(() => {
    return getDaysArray(viewStart, viewEnd);
  }, [viewStart, viewEnd]);

  // Calculate earliest and latest task dates
  const taskDateRange = useMemo(() => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return { earliest: null, latest: null };
    }

    const dates = tasks
      .filter(t => t.startDate || t.endDate)
      .flatMap(t => [t.startDate, t.endDate])
      .filter(Boolean)
      .map(d => new Date(d));

    if (dates.length === 0) {
      return { earliest: null, latest: null };
    }

    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));

    return { earliest, latest };
  }, [tasks]);

  // Navigate timeline
  const navigateTimeline = useCallback((direction) => {
    const daysToMove = zoomLevel === 'day' ? 7 : zoomLevel === 'week' ? 14 : 30;
    const newDate = new Date(viewStart);
    
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - daysToMove);
    } else {
      newDate.setDate(newDate.getDate() + daysToMove);
    }
    
    setViewStart(newDate);
  }, [viewStart, zoomLevel]);

  // Reset to today
  const resetToToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setViewStart(today);
  }, []);

  // Fit to tasks
  const fitToTasks = useCallback(() => {
    if (taskDateRange.earliest && taskDateRange.latest) {
      const start = new Date(taskDateRange.earliest);
      start.setDate(start.getDate() - 7); // Add padding
      start.setHours(0, 0, 0, 0);
      setViewStart(start);
      
      const daysDiff = Math.ceil((taskDateRange.latest - taskDateRange.earliest) / (1000 * 60 * 60 * 24));
      setViewDays(Math.max(daysDiff + 14, DEFAULT_VIEW_DAYS)); // Add padding
    }
  }, [taskDateRange]);

  return {
    zoomLevel,
    setZoomLevel,
    viewStart,
    setViewStart,
    viewEnd,
    viewDays,
    setViewDays,
    cellWidth,
    days,
    zoomConfig,
    taskDateRange,
    navigateTimeline,
    resetToToday,
    fitToTasks,
  };
};

