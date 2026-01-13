/**
 * Custom hook for managing focus trap in modals
 * Ensures keyboard navigation stays within the modal and returns focus to trigger element
 * 
 * @param {boolean} isActive - Whether the focus trap should be active
 * @param {React.RefObject} containerRef - Ref to the modal container element
 * @param {React.RefObject} [triggerRef] - Ref to the element that opened the modal (for returning focus)
 * @returns {void}
 * 
 * @example
 * const modalRef = useRef(null);
 * const triggerRef = useRef(null);
 * useFocusTrap(isOpen, modalRef, triggerRef);
 */
import { useEffect, useRef } from 'react';

export const useFocusTrap = (isActive, containerRef, triggerRef = null) => {
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store the element that had focus before modal opened
    if (!previousActiveElementRef.current) {
      previousActiveElementRef.current = document.activeElement;
    }

    // Get all focusable elements within the modal
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors)).filter(
        (el) => {
          // Filter out hidden elements
          const style = window.getComputedStyle(el);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            !el.hasAttribute('aria-hidden')
          );
        }
      );
    };

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) return;

    // Focus the first focusable element when modal opens
    const firstElement = focusableElements[0];
    if (firstElement && document.activeElement !== firstElement) {
      firstElement.focus();
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      // If Shift+Tab on first element, move to last
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
      // If Tab on last element, move to first
      else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };

    // Handle Escape key to close modal (optional, can be handled by parent)
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // Don't prevent default - let parent handle it
        // This allows modals to have their own close handlers
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keydown', handleEscape);

    // Cleanup: Return focus to trigger element when modal closes
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keydown', handleEscape);

      // Return focus to the element that opened the modal
      if (previousActiveElementRef.current) {
        const elementToFocus = triggerRef?.current || previousActiveElementRef.current;
        
        // Use setTimeout to ensure the modal is fully closed before focusing
        setTimeout(() => {
          if (elementToFocus && typeof elementToFocus.focus === 'function') {
            elementToFocus.focus();
          } else if (elementToFocus instanceof HTMLElement) {
            elementToFocus.focus();
          }
          previousActiveElementRef.current = null;
        }, 100);
      }
    };
  }, [isActive, containerRef, triggerRef]);
};
