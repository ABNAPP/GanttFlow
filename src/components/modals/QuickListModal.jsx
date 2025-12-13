import { memo } from 'react';
import { X, Archive, Trash2 } from 'lucide-react';
import { QuickList } from '../common/QuickList';

export const QuickListModal = memo(({ isOpen, onClose, user, t, onOpenArchive, onOpenTrash }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quicklist-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 id="quicklist-modal-title" className="text-lg font-semibold text-gray-800 dark:text-white">
            {t('quickListTitle')}
          </h2>
          <div className="flex items-center gap-2">
            {onOpenArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenArchive();
                }}
                className="p-2 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                title={t('archive')}
                aria-label={t('archive')}
              >
                <Archive size={18} />
              </button>
            )}
            {onOpenTrash && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTrash();
                }}
                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title={t('trash')}
                aria-label={t('trash')}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} aria-label={t('cancel')}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {user ? (
            <QuickList user={user} t={t} />
          ) : (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
              {t('authLogin')} {t('authLoginSubtitle')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

QuickListModal.displayName = 'QuickListModal';

