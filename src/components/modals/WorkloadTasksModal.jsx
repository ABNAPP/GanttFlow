import { memo, useMemo } from 'react';
import { X, Filter, AlertTriangle } from 'lucide-react';
import { checkIsDone, getTimeStatus } from '../../utils/helpers';

export const WorkloadTasksModal = memo(({
  isOpen,
  onClose,
  tasks,
  role,
  roleLabel,
  warningThreshold,
  onTaskClick,
  t,
}) => {
  const roleTasks = useMemo(() => {
    if (!Array.isArray(tasks) || !role || !roleLabel) return [];
    
    return tasks
      .filter(task => {
        if (task.deleted) return false;
        if (checkIsDone(task.status)) return false;
        const roleValue = task[role];
        // Match exact name (case-insensitive)
        return roleValue && roleValue.trim() !== '' && roleValue.trim().toLowerCase() === roleLabel.trim().toLowerCase();
      })
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
        return dateA - dateB;
      });
  }, [tasks, role, roleLabel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workload-tasks-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 id="workload-tasks-title" className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {roleLabel} - {t('workload')}
          </h2>
          <button onClick={onClose} aria-label={t('cancel')}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {roleTasks.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              {t('noTasks')}
            </div>
          ) : (
            <div className="space-y-3">
              {roleTasks.map((task) => {
                const { isOverdue, isWarning } = getTimeStatus(task, warningThreshold);
                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      onTaskClick(task);
                      onClose();
                    }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {(isOverdue || isWarning) && (
                          <AlertTriangle
                            size={14}
                            className={isOverdue ? 'text-red-500' : 'text-amber-500'}
                            aria-label={isOverdue ? t('statusLate') : t('warning')}
                          />
                        )}
                        <h3 className={`font-semibold text-gray-800 dark:text-gray-200 ${
                          isOverdue ? 'text-red-600 dark:text-red-400' : ''
                        }`}>
                          {task.title}
                        </h3>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {task.phase && <span>{task.phase} • </span>}
                        {task.startDate} - {task.endDate}
                      </div>
                      {task.client && (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                          {task.client}
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-medium ${
                      isOverdue
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : (task.status || '').toLowerCase().includes('klar') || (task.status || '').toLowerCase().includes('done')
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : (task.status || '').toLowerCase().includes('pågående') || (task.status || '').toLowerCase().includes('progress')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {task.status || 'Planerad'}
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

WorkloadTasksModal.displayName = 'WorkloadTasksModal';

