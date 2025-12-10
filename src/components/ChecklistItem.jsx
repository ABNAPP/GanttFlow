import { memo } from 'react';
import { CheckSquare, Edit2, Trash2 } from 'lucide-react';
import { getTimeStatus } from '../utils/helpers';
import { AlertTriangle } from 'lucide-react';

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
        <div className="flex gap-2">
          <input
            type="date"
            value={tempData.startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-1/2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-xs"
            aria-label={t('checklistStart')}
          />
          <input
            type="date"
            value={tempData.endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-1/2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-xs"
            aria-label={t('checklistEnd')}
          />
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
          aria-label={item.done ? 'Mark as incomplete' : 'Mark as complete'}
          aria-checked={item.done}
        >
          <CheckSquare size={18} className={item.done ? 'fill-current' : ''} />
        </button>

        {(subStatus.isOverdue || subStatus.isWarning) && (
          <AlertTriangle
            size={10}
            title={subStatus.isOverdue ? t('statusLate') : 'Närmar sig deadline'}
            className={`mt-0.5 flex-shrink-0 ${subStatus.isOverdue ? 'text-red-500' : 'text-amber-500'}`}
            aria-label={subStatus.isOverdue ? t('statusLate') : 'Warning'}
          />
        )}

        <span
          className={`flex-1 text-sm ${
            item.done
              ? 'line-through text-gray-400'
              : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {item.text}
        </span>

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
      {(item.startDate || item.endDate) && (
        <div className="pl-6 text-[10px] text-gray-400 flex gap-2">
          {item.startDate && <span>S: {item.startDate}</span>}
          {item.endDate && (
            <span className={subStatus.isOverdue ? 'text-red-400 font-bold' : ''}>
              E: {item.endDate}
            </span>
          )}
        </div>
      )}
    </>
  );
});

ChecklistItem.displayName = 'ChecklistItem';

