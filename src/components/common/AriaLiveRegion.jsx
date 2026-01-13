/**
 * ARIA Live Region component for announcing dynamic content changes
 * Complements the toast notification system for screen reader accessibility
 * 
 * This component provides a dedicated aria-live region that announces
 * important dynamic content changes that may not be covered by toast notifications
 */
import { useEffect, useRef } from 'react';

/**
 * ARIA Live Region component
 * Provides a screen reader-accessible region for announcing dynamic content
 * 
 * @param {Object} props
 * @param {string} props.message - Message to announce (optional, can be set via ref)
 * @param {'polite'|'assertive'} props.politeness - Announcement priority (default: 'polite')
 * @param {boolean} props.atomic - Whether entire region should be read (default: true)
 */
export const AriaLiveRegion = ({ 
  message = '', 
  politeness = 'polite', 
  atomic = true 
}) => {
  const regionRef = useRef(null);

  useEffect(() => {
    if (message && regionRef.current) {
      // Clear and set message to trigger announcement
      regionRef.current.textContent = '';
      // Use setTimeout to ensure the change is detected
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
      aria-relevant="additions text"
    >
      {message}
    </div>
  );
};

/**
 * Hook to manage ARIA live region announcements
 * Returns a function to announce messages
 */
export const useAriaLive = () => {
  const announceRef = useRef(null);

  const announce = (message, politeness = 'polite') => {
    if (announceRef.current) {
      // Clear first to ensure new message is announced
      announceRef.current.textContent = '';
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = message;
          announceRef.current.setAttribute('aria-live', politeness);
        }
      }, 100);
    }
  };

  return { announce, announceRef };
};
