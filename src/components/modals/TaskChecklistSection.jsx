/**
 * TaskChecklistSection - Checklist section for TaskModal
 * Extracted from TaskModal.jsx to reduce complexity
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ChecklistItem } from '../common/ChecklistItem';
import { generateId, calculateChecklistProgress } from '../../utils/helpers';
import { showError } from '../../utils/toast';
import { validateAndSanitizeInput } from '../../utils/sanitize';

export const TaskChecklistSection = ({
  checklist,
  onChecklistChange,
  warningThreshold,
  t,
}) => {
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklistStartDate, setNewChecklistStartDate] = useState('');
  const [newChecklistEndDate, setNewChecklistEndDate] = useState('');
  const [newChecklistExecutor, setNewChecklistExecutor] = useState('');
  const [newChecklistPriority, setNewChecklistPriority] = useState('normal');
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [tempChecklistData, setTempChecklistData] = useState({});

  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) return;
    // Sanitize checklist item text and executor
    const sanitizedText = validateAndSanitizeInput(newChecklistItem.trim(), 500);
    const sanitizedExecutor = newChecklistExecutor
      ? validateAndSanitizeInput(newChecklistExecutor.trim(), 100)
      : null;

    if (!sanitizedText) {
      showError(t('errorChecklistItemEmpty') || 'Checklist item cannot be empty');
      return;
    }

    const newItem = {
      id: generateId(),
      text: sanitizedText,
      done: false,
      startDate: newChecklistStartDate || null,
      endDate: newChecklistEndDate || null,
      executor: sanitizedExecutor,
      priority: newChecklistPriority || 'normal',
    };
    onChecklistChange([...(checklist || []), newItem]);
    setNewChecklistItem('');
    setNewChecklistStartDate('');
    setNewChecklistEndDate('');
    setNewChecklistExecutor('');
    setNewChecklistPriority('normal');
  };

  const toggleChecklist = (id) => {
    const updated = checklist.map((item) => {
      if (item.id === id) return { ...item, done: !item.done };
      return item;
    });
    onChecklistChange(updated);
  };

  const removeChecklist = (id) => {
    const updated = checklist.filter((item) => item.id !== id);
    onChecklistChange(updated);
  };

  const startEditingChecklist = (item) => {
    setEditingChecklistId(item.id);
    setTempChecklistData({
      text: item.text,
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      executor: item.executor || '',
      priority: item.priority || 'normal',
    });
  };

  const saveEditingChecklist = () => {
    // Sanitize edited checklist item
    const sanitizedText = tempChecklistData.text
      ? validateAndSanitizeInput(tempChecklistData.text, 500)
      : '';
    const sanitizedExecutor = tempChecklistData.executor
      ? validateAndSanitizeInput(tempChecklistData.executor.trim(), 100)
      : null;

    if (!sanitizedText) {
      showError(t('errorChecklistItemEmpty') || 'Checklist item cannot be empty');
      return;
    }

    const updated = checklist.map((item) => {
      if (item.id === editingChecklistId) {
        return {
          ...item,
          text: sanitizedText,
          startDate: tempChecklistData.startDate || null,
          endDate: tempChecklistData.endDate || null,
          executor: sanitizedExecutor,
          priority: tempChecklistData.priority || item.priority || 'normal',
        };
      }
      return item;
    });
    onChecklistChange(updated);
    setEditingChecklistId(null);
    setTempChecklistData({});
  };

  const cancelEditingChecklist = () => {
    setEditingChecklistId(null);
    setTempChecklistData({});
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex justify-between">
        {t('labelChecklist')}{' '}
        <span className="text-indigo-500">
          {calculateChecklistProgress(checklist)}%
        </span>
      </h3>
      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full mb-4">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${calculateChecklistProgress(checklist)}%` }}
          role="progressbar"
          aria-valuenow={calculateChecklistProgress(checklist)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="space-y-2 mb-3">
        {checklist?.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1 py-1 border-b border-gray-100 dark:border-gray-600/30 last:border-0"
          >
            <ChecklistItem
              item={item}
              isEditing={editingChecklistId === item.id}
              tempData={tempChecklistData}
              warningThreshold={warningThreshold}
              onToggle={() => toggleChecklist(item.id)}
              onEdit={() => startEditingChecklist(item)}
              onSaveEdit={saveEditingChecklist}
              onCancelEdit={cancelEditingChecklist}
              onDelete={() => removeChecklist(item.id)}
              onTextChange={(text) =>
                setTempChecklistData((prev) => ({ ...prev, text }))
              }
              onStartDateChange={(date) =>
                setTempChecklistData((prev) => ({ ...prev, startDate: date }))
              }
              onEndDateChange={(date) =>
                setTempChecklistData((prev) => ({ ...prev, endDate: date }))
              }
              onExecutorChange={(executor) =>
                setTempChecklistData((prev) => ({ ...prev, executor }))
              }
              onPriorityChange={(priority) =>
                setTempChecklistData((prev) => ({ ...prev, priority }))
              }
              t={t}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newChecklistItem}
            onChange={(e) => {
              setNewChecklistItem(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddChecklist();
              }
            }}
            placeholder={t('phChecklist')}
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
            aria-label={t('phChecklist')}
            maxLength={500}
          />
          <button
            type="button"
            onClick={handleAddChecklist}
            className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors"
            aria-label={t('addChecklistItem')}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex gap-2 items-center text-xs flex-wrap">
          <label className="text-gray-500 dark:text-gray-400">
            {t('checklistStart')}:
          </label>
          <input
            type="date"
            value={newChecklistStartDate}
            onChange={(e) => setNewChecklistStartDate(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 outline-none text-gray-600 dark:text-gray-300"
            aria-label={t('checklistStart')}
          />
          <label className="text-gray-500 dark:text-gray-400 ml-2">
            {t('checklistEnd')}:
          </label>
          <input
            type="date"
            value={newChecklistEndDate}
            onChange={(e) => setNewChecklistEndDate(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 outline-none text-gray-600 dark:text-gray-300"
            aria-label={t('checklistEnd')}
          />
          <label className="text-gray-500 dark:text-gray-400 ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
            {t('statExecutor')}:
          </label>
          <input
            type="text"
            value={newChecklistExecutor}
            onChange={(e) => {
              const sanitized = validateAndSanitizeInput(e.target.value, 100);
              setNewChecklistExecutor(sanitized);
            }}
            placeholder={t('hlPlaceholder')}
            className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/40 rounded px-2 py-1 outline-none text-gray-700 dark:text-gray-300 text-xs"
            aria-label={t('statExecutor')}
          />
          <label className="text-gray-500 dark:text-gray-400 ml-2">
            {t('labelPriority')}:
          </label>
          <select
            value={newChecklistPriority}
            onChange={(e) => setNewChecklistPriority(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 outline-none text-gray-600 dark:text-gray-300 text-xs"
            aria-label={t('labelPriority')}
          >
            <option value="low">{t('priorityLow')}</option>
            <option value="normal">{t('priorityNormal')}</option>
            <option value="high">{t('priorityHigh')}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
