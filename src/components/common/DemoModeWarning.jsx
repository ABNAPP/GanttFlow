/**
 * Demo Mode Warning Component
 * 
 * Displays a warning banner when the app is running in demo mode (using localStorage)
 * to inform users that data is stored locally and may be lost.
 */
import { memo } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export const DemoModeWarning = memo(({ user, onDismiss, t }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only show if user is in demo mode
    if (user && user.uid && user.uid.startsWith('demo-user-')) {
      // Check if user has dismissed this warning before
      const dismissed = localStorage.getItem('demo-mode-warning-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [user]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Remember dismissal for this session
    localStorage.setItem('demo-mode-warning-dismissed', 'true');
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            {t('demoModeWarningTitle') || 'Demo Mode - Local Storage'}
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {t('demoModeWarningMessage') || 
              'You are currently using the app in demo mode. Your data is stored locally in your browser and may be lost if you clear your browser data or use a different device. To enable cloud sync, please configure Firebase Authentication.'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 flex-shrink-0"
          aria-label={t('dismiss') || 'Dismiss'}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
});

DemoModeWarning.displayName = 'DemoModeWarning';

