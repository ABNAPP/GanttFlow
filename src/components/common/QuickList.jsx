import { memo, useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, List } from 'lucide-react';
import { useQuickList } from '../../hooks/useQuickList';

export const QuickList = memo(({ user, t }) => {
  const { items, loading, addItem, toggleItem, deleteItem } = useQuickList(user);
  const [newItemText, setNewItemText] = useState('');

  // Debug log
  useEffect(() => {
    console.log('[QuickList] Component rendered', { user: !!user, loading, itemsCount: items.length });
  }, [user, loading, items.length]);

  const handleAdd = () => {
    if (newItemText.trim()) {
      addItem(newItemText);
      setNewItemText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  // Always render, even if loading or no user
  if (!user) {
    return null; // Don't render if no user
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 flex flex-col max-h-[300px] min-h-[200px]">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 flex-shrink-0">
          <List size={14} className="text-indigo-500 dark:text-indigo-400" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {t('quickList')}
          </span>
        </div>
        <div className="p-4 text-gray-400 text-xs text-center flex-1 flex items-center justify-center">
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 flex-shrink-0">
        <List size={14} className="text-indigo-500 dark:text-indigo-400" />
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {t('quickList')}
        </span>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-xs">
            {t('quickListEmpty')}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((item) => (
              <div
                key={item.id}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`p-0.5 rounded ${
                    item.done
                      ? 'text-green-500'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  aria-label={item.done ? t('markAsIncomplete') : t('markAsComplete')}
                  aria-checked={item.done}
                >
                  <CheckSquare size={16} className={item.done ? 'fill-current' : ''} />
                </button>
                <span
                  className={`flex-1 text-sm ${
                    item.done
                      ? 'line-through text-gray-400'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t('delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Input */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('quickListPlaceholder')}
            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
            aria-label={t('quickListPlaceholder')}
          />
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
            aria-label={t('addQuickItem')}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});

QuickList.displayName = 'QuickList';

