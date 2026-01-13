import { memo, useMemo, useRef } from 'react';
import { X, Filter, AlertTriangle } from 'lucide-react';
import { checkIsDone, getTimeStatus, getActiveSubtasksForMetrics } from '../../utils/helpers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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
  const roleItems = useMemo(() => {
    if (!Array.isArray(tasks) || !role || !roleLabel) return [];
    
    // For executor role, show subtasks (checklist items) instead of main tasks
    // Uses getActiveSubtasksForMetrics (SINGLE SOURCE OF TRUTH) to ensure consistency
    if (role === 'executor') {
      const rows = getActiveSubtasksForMetrics(tasks)
        .filter((row) => {
          // Match exact name (case-insensitive)
          return row.executor && row.executor.trim().toLowerCase() === roleLabel.trim().toLowerCase();
        })
        .map((row) => ({
          type: 'subtask',
          task: row._taskRef, // Reference to original task for onTaskClick
          item: {
            id: row.itemId,
            text: row.itemText,
            startDate: row.itemStartDate,
            endDate: row.itemEndDate,
            done: false, // Already filtered by isActiveSubtask
          },
          // Use subtask dates if available, otherwise task dates
          startDate: row.itemStartDate || row.taskStartDate || '',
          endDate: row.itemEndDate || row.taskEndDate || '',
          title: row.itemText || t('subtask'),
          phase: row.taskPhase,
          client: row._taskRef?.client || null,
          priority: row.priority, // Already normalized by getActiveSubtasksForMetrics
        }))
        .sort((a, b) => {
          // Sort by itemStartDate (fallback to taskStartDate)
          const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
          const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
          return dateA - dateB;
        });
      
      return rows;
    }
    
    // For other roles, show main tasks (backward compatible)
    return tasks
      .filter(task => {
        if (task.deleted) return false;
        if (checkIsDone(task.status)) return false;
        const roleValue = task[role];
        // Match exact name (case-insensitive)
        return roleValue && roleValue.trim() !== '' && roleValue.trim().toLowerCase() === roleLabel.trim().toLowerCase();
      })
      .map(task => ({
        type: 'task',
        task,
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        title: task.title,
        phase: task.phase,
        client: task.client,
        status: task.status,
      }))
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
        return dateA - dateB;
      });
  }, [tasks, role, roleLabel, t]);

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
      aria-labelledby="workload-tasks-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-[95vw] sm:max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col"
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
          {roleItems.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              {t('noTasks')}
            </div>
          ) : (
            <div className="space-y-3">
              {roleItems.map((item, idx) => {
                // For subtasks, use item data; for tasks, use task data
                const timeStatusItem = item.type === 'subtask' ? item.item : item.task;
                const { isOverdue, isWarning } = getTimeStatus(timeStatusItem, warningThreshold);
                const displayTitle = item.title;
                const displayStatus = item.type === 'subtask' 
                  ? (item.item.done ? t('statusDone') : (item.item.startDate || item.item.endDate ? t('statusProg') : t('statusPlan')))
                  : (item.status || 'Planerad');
                
                return (
                  <div
                    key={item.type === 'subtask' ? `${item.task.id}-${item.item.id || idx}` : item.task.id}
                    onClick={() => {
                      // Always click on the parent task
                      onTaskClick(item.task);
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
                          {displayTitle}
                        </h3>
                        {item.type === 'subtask' && item.priority && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            item.priority === 'Hög'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : item.priority === 'Låg'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                            {item.priority === 'Hög' ? t('priorityHigh') : item.priority === 'Låg' ? t('priorityLow') : t('priorityNormal')}
                          </span>
                        )}
                      </div>
                      {item.type === 'subtask' && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('subtask')} • {item.task.title}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.phase && <span>{item.phase} • </span>}
                        {item.startDate && item.endDate ? `${item.startDate} - ${item.endDate}` : item.startDate || item.endDate || ''}
                      </div>
                      {item.client && (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                          {item.client}
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-medium ${
                      isOverdue
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : displayStatus.toLowerCase().includes('klar') || displayStatus.toLowerCase().includes('done')
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : displayStatus.toLowerCase().includes('pågående') || displayStatus.toLowerCase().includes('progress')
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {displayStatus}
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

