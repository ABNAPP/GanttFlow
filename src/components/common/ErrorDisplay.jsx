/**
 * Component for displaying error states with retry functionality
 */
import { memo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorDisplay = memo(({ error, onRetry, t }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {t('networkErrorRetry') || 'Network error. Click to retry.'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">
              {error.message || error.toString()}
            </p>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            aria-label={t('retry') || 'Retry'}
          >
            <RefreshCw size={16} />
            {t('retry') || 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';

