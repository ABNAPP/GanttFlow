import { memo, useRef } from 'react';
import { X, BarChart3, Filter } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

export const StatsModal = memo(({
  isOpen,
  onClose,
  workloadStats,
  statsRole,
  onStatsRoleChange,
  t,
}) => {
  const modalRef = useRef(null);

  // Focus trap for keyboard navigation
  useFocusTrap(isOpen, modalRef);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 id="stats-title" className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t('workload')}
          </h2>
          <button onClick={onClose} aria-label={t('cancel')}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 relative">
            <select
              value={statsRole}
              onChange={(e) => onStatsRoleChange(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-2 px-4 rounded outline-none appearance-none text-sm font-medium text-gray-700 dark:text-gray-200"
              aria-label="Select role for statistics"
            >
              <option value="executor">{t('statExecutor')}</option>
              <option value="assignee">{t('statAssignee')}</option>
              <option value="cad">{t('statCad')}</option>
              <option value="reviewer">{t('statReviewer')}</option>
              <option value="agent">{t('statAgent')}</option>
              <option value="be">{t('statBe')}</option>
              <option value="pl">{t('statPl')}</option>
            </select>
            <Filter className="w-3.5 h-3.5 absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {workloadStats.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-100 dark:border-gray-700"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{name}</span>
                <span className="bg-white dark:bg-gray-600 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-500 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                  {count}
                </span>
              </div>
            ))}
            {workloadStats.length === 0 && (
              <div className="text-center text-gray-400 text-xs">{t('noData')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

StatsModal.displayName = 'StatsModal';

