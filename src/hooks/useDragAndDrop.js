import { useState, useEffect, useRef } from 'react';
import { ZOOM_LEVELS, DRAG_THRESHOLD } from '../constants';
import { formatDate } from '../utils/helpers';

export const useDragAndDrop = (tasks, zoomLevel, cellWidth, updateTask) => {
  const [dragState, setDragState] = useState(null);
  const dragMovedRef = useRef(false);

  const handleDragStart = (e, task) => {
    e.stopPropagation();

    let clientX;
    if (e.type === 'touchstart') {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    dragMovedRef.current = false;
    setDragState({
      taskId: task.id,
      startX: clientX,
      currentX: clientX,
      originalStart: new Date(task.startDate),
      originalEnd: new Date(task.endDate),
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e) => {
      if (!dragState) return;

      let clientX;
      if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const delta = clientX - dragState.startX;
      if (!dragMovedRef.current && Math.abs(delta) > DRAG_THRESHOLD) {
        dragMovedRef.current = true;
      }
      setDragState((prev) => (prev ? { ...prev, currentX: clientX } : prev));
    };

    const handleUp = async () => {
      if (!dragState) return;
      
      const diffPixels = dragState.currentX - dragState.startX;
      const daysMoved = Math.round(diffPixels / cellWidth);

      if (daysMoved !== 0 && dragMovedRef.current) {
        const newStart = new Date(dragState.originalStart);
        newStart.setDate(newStart.getDate() + daysMoved);
        const newEnd = new Date(dragState.originalEnd);
        newEnd.setDate(newEnd.getDate() + daysMoved);

        try {
          await updateTask(dragState.taskId, {
            startDate: formatDate(newStart),
            endDate: formatDate(newEnd),
          });
        } catch (err) {
          console.error('Error updating drag dates:', err);
        }
      }

      // Reset drag state
      dragMovedRef.current = false;
      setDragState(null);
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragState, cellWidth, updateTask]);

  return {
    dragState,
    handleDragStart,
    dragMovedRef,
  };
};


