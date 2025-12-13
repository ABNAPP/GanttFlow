// Quick List View - Full view for quick list
import { memo } from 'react';
import { Archive, Trash2, Zap } from 'lucide-react';
import { QuickList } from '../common/QuickList';

export const QuickListView = memo(({ user, t, onOpenArchive, onOpenTrash }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {t('quickListTitle')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onOpenArchive && (
            <button
              onClick={onOpenArchive}
              className="p-2 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title={t('archive')}
              aria-label={t('archive')}
            >
              <Archive size={18} />
            </button>
          )}
          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title={t('trash')}
              aria-label={t('trash')}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {user ? (
          <div className="max-w-2xl mx-auto">
            <QuickList user={user} t={t} />
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
            {t('authLogin')} {t('authLoginSubtitle')}
          </div>
        )}
      </div>
    </div>
  );
});

QuickListView.displayName = 'QuickListView';

