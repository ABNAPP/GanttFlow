import { memo } from 'react';
import { Layers, ArrowUpDown } from 'lucide-react';
import { TaskItem } from './TaskItem';

export const Sidebar = memo(({
  isOpen,
  tasks,
  loading,
  searchTerm,
  onlyMyTasks,
  sortOption,
  expandedTaskIds,
  warningThreshold,
  onToggleExpand,
  onEdit,
  onQuickStatusChange,
  onChecklistToggle,
  onSearchChange,
  onOnlyMyTasksToggle,
  onSortChange,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-full sm:w-72 md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 transition-colors duration-300 absolute md:relative h-full overflow-hidden">
      {/* Sidebar Header with Sort */}
      <div className="h-10 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-gray-50 dark:bg-gray-800 flex-shrink-0 z-20">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {t('myTasks')}
        </span>
        <div className="flex items-center gap-1">
          <ArrowUpDown size={12} className="text-gray-400" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-xs text-gray-600 dark:text-gray-400 outline-none cursor-pointer border-none focus:ring-0 p-0"
            aria-label={t('sortBy')}
          >
            <option value="startDate" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              {t('sortStart')}
            </option>
            <option value="endDate" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              {t('sortEnd')}
            </option>
            <option value="title" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              {t('sortTitle')}
            </option>
          </select>
        </div>
      </div>

      {/* Tasks List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-4 text-gray-400 text-xs text-center">{t('loading')}</div>
        ) : !tasks || Object.keys(tasks).length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">{t('noTasks')}</div>
        ) : (
          Object.entries(tasks).map(([phase, groupTasks]) => (
            <div key={phase} className="mb-0">
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-700/50 border-y border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2 z-10 backdrop-blur-sm">
                <Layers className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {phase}
                </span>
                <span className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 rounded-full text-gray-600 dark:text-gray-300">
                  {groupTasks.length}
                </span>
              </div>
              {groupTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isExpanded={expandedTaskIds.has(task.id)}
                  warningThreshold={warningThreshold}
                  onToggleExpand={onToggleExpand}
                  onEdit={onEdit}
                  onQuickStatusChange={onQuickStatusChange}
                  onChecklistToggle={onChecklistToggle}
                  t={t}
                />
              ))}
            </div>
          ))
        )}
      </div>

    </div>
  );
});

Sidebar.displayName = 'Sidebar';

