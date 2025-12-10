import { memo } from 'react';
import { ChevronRight, ChevronDown, AlertTriangle, Briefcase, CheckSquare } from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { getTimeStatus, calculateChecklistProgress } from '../utils/helpers';

export const TaskItem = memo(({
  task,
  isExpanded,
  warningThreshold,
  onToggleExpand,
  onEdit,
  onQuickStatusChange,
  onChecklistToggle,
  t,
}) => {
  const progress = calculateChecklistProgress(task.checklist);
  const { isOverdue, isWarning } = getTimeStatus(task, warningThreshold);
  const hasSubtasks = task.checklist && task.checklist.length > 0;

  return (
    <div className="border-b border-gray-50 dark:border-gray-700/50">
      <div
        onClick={() => onEdit(task)}
        className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors group relative"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit(task);
          }
        }}
        aria-label={`Edit task: ${task.title}`}
      >
        <div className="flex flex-col gap-1 mb-1.5">
          {task.client && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              <Briefcase size={10} />
              <span className="truncate">{task.client}</span>
            </div>
          )}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1 max-w-[60%]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasSubtasks) onToggleExpand(task.id);
                }}
                className={`p-0.5 rounded transition-colors ${
                  hasSubtasks
                    ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer'
                    : 'text-transparent cursor-default'
                }`}
                disabled={!hasSubtasks}
                aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {(isOverdue || isWarning) && (
                <AlertTriangle
                  size={12}
                  className={isOverdue ? 'text-red-500' : 'text-amber-500'}
                  aria-label={isOverdue ? t('statusLate') : 'Warning'}
                />
              )}
              <h3
                className={`font-medium text-xs truncate pr-2 ${
                  isOverdue
                    ? 'text-red-600 dark:text-red-400 font-bold'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {task.title}
              </h3>
            </div>

            <div onClick={(e) => e.stopPropagation()} className="relative">
              <select
                value={task.status}
                onChange={(e) => onQuickStatusChange(e, task.id)}
                className={`text-[9px] py-0.5 pl-1 pr-0 rounded-sm border-2 cursor-pointer appearance-none outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500 ${
                  isOverdue ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ maxWidth: '70px' }}
                aria-label={`Change status for ${task.title}`}
              >
                {isOverdue ? (
                  <option value={task.status}>{t('statusLate')}</option>
                ) : (
                  <>
                    <option value="Planerad">{t('statusPlan')}</option>
                    <option value="Pågående">{t('statusProg')}</option>
                    <option value="Klar">{t('statusDone')}</option>
                    <option value="Försenad">{t('statusLate')}</option>
                  </>
                )}
                {isOverdue && (
                  <>
                    <option value="Planerad">{t('statusPlan')}</option>
                    <option value="Pågående">{t('statusProg')}</option>
                    <option value="Klar">{t('statusDone')}</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1 pl-4">
          <RoleBadge label="UA" value={task.assignee} />
          <RoleBadge label="HL" value={task.executor} color="text-indigo-500 dark:text-indigo-400" />
        </div>

        {task.checklist && task.checklist.length > 0 && (
          <div className="flex items-center gap-1 mt-1 pl-4">
            <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress: ${progress}%`}
              />
            </div>
            <span className="text-[8px] text-gray-400">{progress}%</span>
          </div>
        )}
      </div>

      {isExpanded && hasSubtasks && (
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
          {task.checklist.map((item) => {
            const subStatus = getTimeStatus(item, warningThreshold);
            return (
              <div
                key={item.id}
                className="flex flex-col py-1 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChecklistToggle(task, item.id);
                    }}
                    className={`mt-0.5 ${
                      item.done
                        ? 'text-green-500'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    aria-label={item.done ? 'Mark as incomplete' : 'Mark as complete'}
                    aria-checked={item.done}
                  >
                    <CheckSquare
                      size={12}
                      className={item.done ? 'fill-current' : ''}
                    />
                  </button>

                  {(subStatus.isOverdue || subStatus.isWarning) && (
                    <AlertTriangle
                      size={10}
                      title={subStatus.isOverdue ? 'Försenad' : 'Närmar sig deadline'}
                      className={`mt-0.5 flex-shrink-0 ${subStatus.isOverdue ? 'text-red-500' : 'text-amber-500'}`}
                    />
                  )}

                  <span
                    className={`text-[10px] leading-tight ${
                      item.done
                        ? 'line-through text-gray-400'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
                {(item.startDate || item.endDate) && (
                  <div className="pl-5 text-[9px] text-gray-400 flex gap-2">
                    {item.startDate && <span>S: {item.startDate}</span>}
                    {item.endDate && (
                      <span className={subStatus.isOverdue ? 'text-red-400 font-bold' : ''}>
                        E: {item.endDate}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

