import { memo } from 'react';
import { X, Trash2, RotateCcw, XCircle, Check } from 'lucide-react';

export const TrashModal = memo(({
  isOpen,
  onClose,
  deletedTasks,
  onRestore,
  onPermanentDelete,
  confirmDeleteId,
  confirmEmptyTrash,
  onSetConfirmDeleteId,
  onSetConfirmEmptyTrash,
  onEmptyTrash,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trash-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-[95vw] sm:max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 id="trash-title" className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" /> {t('trashTitle')}
          </h2>
          <div className="flex gap-2 items-center">
            {deletedTasks.length > 0 &&
              (!confirmEmptyTrash ? (
                <button
                  onClick={() => onSetConfirmEmptyTrash(true)}
                  className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1"
                  aria-label={t('emptyTrash')}
                >
                  <XCircle size={14} /> {t('emptyTrash')}
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 px-2 py-1.5 rounded border border-red-100 dark:border-red-800">
                  <span className="text-xs font-bold text-red-600 dark:text-red-300">{t('sure')}</span>
                  <button
                    onClick={onEmptyTrash}
                    className="text-white bg-red-500 hover:bg-red-600 text-xs px-2 py-0.5 rounded flex items-center gap-1"
                    aria-label={t('yes')}
                  >
                    <Check size={12} /> {t('yes')}
                  </button>
                  <button
                    onClick={() => onSetConfirmEmptyTrash(false)}
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs px-2 py-0.5 rounded flex items-center gap-1"
                    aria-label={t('no')}
                  >
                    <XCircle size={12} /> {t('no')}
                  </button>
                </div>
              ))}
            <button onClick={onClose} aria-label={t('cancel')}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {deletedTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <Trash2 className="w-12 h-12 mb-4 opacity-20" />
              <p>{t('noDeleted')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedTasks.map((task) => {
                const deletedAtLabel = task.deletedAt
                  ? new Date(task.deletedAt).toLocaleDateString()
                  : '-';
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 line-through opacity-70">
                        {task.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('delete')}: {deletedAtLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onRestore(task.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                        aria-label={t('restore')}
                      >
                        <RotateCcw size={14} /> {t('restore')}
                      </button>
                      {confirmDeleteId === task.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-500 font-bold">{t('sure')}</span>
                          <button
                            onClick={() => onPermanentDelete(task.id)}
                            className="text-red-500 hover:text-red-700 p-1 font-bold text-xs border border-red-200 rounded bg-red-50"
                            aria-label={t('yes')}
                          >
                            {t('yes')}
                          </button>
                          <button
                            onClick={() => onSetConfirmDeleteId(null)}
                            className="text-gray-400 hover:text-gray-600 p-1 text-xs"
                            aria-label={t('no')}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onSetConfirmDeleteId(task.id)}
                          className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title={t('deletePermanent')}
                          aria-label={t('deletePermanent')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TrashModal.displayName = 'TrashModal';

