import { memo } from 'react';
import { CheckSquare, Edit2, Trash2 } from 'lucide-react';
import { getTimeStatus } from '../../utils/helpers';
import { AlertTriangle } from 'lucide-react';
import { sanitizeText } from '../../utils/sanitize';

export const ChecklistItem = memo(({
  item,
  isEditing,
  tempData,
  onToggle,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onTextChange,
  onStartDateChange,
  onEndDateChange,
  onExecutorChange,
  onPriorityChange,
  warningThreshold,
  t,
}) => {
  const subStatus = getTimeStatus(item, warningThreshold);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-indigo-200 dark:border-indigo-700">
        <div className="text-xs font-bold text-indigo-500 uppercase">{t('revise')}</div>
        <input
          type="text"
          value={tempData.text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-sm outline-none"
          aria-label={t('revise')}
        />
        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            value={tempData.startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="flex-1 min-w-[120px] border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-xs"
            aria-label={t('checklistStart')}
          />
          <input
            type="date"
            value={tempData.endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="flex-1 min-w-[120px] border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-xs"
            aria-label={t('checklistEnd')}
          />
          <input
            type="text"
            value={tempData.executor || ''}
            onChange={(e) => onExecutorChange && onExecutorChange(e.target.value)}
            placeholder={t('hlPlaceholder')}
            className="flex-1 min-w-[120px] border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/40 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
            aria-label={t('statExecutor')}
          />
          <select
            value={tempData.priority || 'normal'}
            onChange={(e) => onPriorityChange && onPriorityChange(e.target.value)}
            className="flex-1 min-w-[100px] border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
            aria-label={t('labelPriority')}
          >
            <option value="low">{t('priorityLow')}</option>
            <option value="normal">{t('priorityNormal')}</option>
            <option value="high">{t('priorityHigh')}</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
            aria-label={t('cancel')}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onSaveEdit}
            className="text-xs bg-indigo-500 text-white hover:bg-indigo-600 px-2 py-1 rounded flex items-center gap-1"
            aria-label={t('save')}
          >
            {t('save')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 group">
        <button
          type="button"
          onClick={onToggle}
          className={`p-0.5 rounded ${
            item.done
              ? 'text-green-500'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          aria-label={item.done ? t('markAsIncomplete') : t('markAsComplete')}
          aria-checked={item.done}
        >
          <CheckSquare size={18} className={item.done ? 'fill-current' : ''} />
        </button>

        {(subStatus.isOverdue || subStatus.isWarning) && (
          <AlertTriangle
            size={10}
            title={subStatus.isOverdue ? t('statusLate') : t('approachingDeadline')}
            className={`mt-0.5 flex-shrink-0 ${subStatus.isOverdue ? 'text-red-500' : 'text-amber-500'}`}
            aria-label={subStatus.isOverdue ? t('statusLate') : t('warning')}
          />
        )}

        {/* Priority indicator */}
        {item.priority && (
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              item.priority === 'high'
                ? 'bg-red-500'
                : item.priority === 'normal'
                ? 'bg-blue-500'
                : 'bg-green-500'
            }`}
            title={t(`priority${item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}`)}
            aria-label={t(`priority${item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}`)}
          />
        )}

        <span
          className={`flex-1 text-sm ${
            item.done
              ? 'line-through text-gray-400'
              : 'text-gray-700 dark:text-gray-200'
          }`}
          dangerouslySetInnerHTML={{ __html: sanitizeText(item.text) }}
        />

        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
            title={t('revise')}
            aria-label={t('revise')}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title={t('delete')}
            aria-label={t('delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {(item.startDate || item.endDate || item.executor) && (
        <div className="pl-6 text-[10px] text-gray-400 flex gap-2 flex-wrap">
          {item.startDate && <span>{t('startDateLabel')}: {item.startDate}</span>}
          {item.endDate && (
            <span className={subStatus.isOverdue ? 'text-red-400 font-bold' : ''}>
              {t('endDateLabel')}: {item.endDate}
            </span>
          )}
          {item.executor && (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {t('statExecutor')}: <span dangerouslySetInnerHTML={{ __html: sanitizeText(item.executor) }} />
            </span>
          )}
        </div>
      )}
    </>
  );
});

ChecklistItem.displayName = 'ChecklistItem';

