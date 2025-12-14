import { memo, useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, List, Circle, Edit2, Archive, X, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuickList } from '../../hooks/useQuickList';
import { showSuccess } from '../../utils/toast';

export const QuickList = memo(({ user, t }) => {
  const { items, loading, addItem, toggleItem, deleteItem, archiveItem, updateItemPriority, updateItemText } = useQuickList(user);
  const [newItemText, setNewItemText] = useState('');
  const [newItemPriority, setNewItemPriority] = useState('normal');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('normal');

  // Debug log
  useEffect(() => {
    console.log('[QuickList] Component rendered', { user: !!user, loading, itemsCount: items.length });
  }, [user, loading, items.length]);

  const handleAdd = () => {
    if (newItemText.trim()) {
      addItem(newItemText, newItemPriority);
      setNewItemText('');
      setNewItemPriority('normal');
    }
  };

  const getPriorityColorClass = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'normal': return 'text-blue-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditPriority(item.priority || 'normal');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditPriority('normal');
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingId) {
      updateItemText(editingId, editText, editPriority);
      showSuccess(t('quickListItemUpdated'));
      handleCancelEdit();
    }
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleArchive = (id) => {
    archiveItem(id);
    showSuccess(t('quickListItemArchived'));
  };

  const handleDelete = (id) => {
    if (window.confirm(t('quickListConfirmDelete'))) {
      deleteItem(id);
      showSuccess(t('quickListItemDeleted'));
    }
  };

  // Always render, even if loading or no user
  if (!user) {
    return null; // Don't render if no user
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl shadow-sm flex flex-col max-h-[300px] min-h-[200px]">
        <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800/30 flex items-center gap-2 flex-shrink-0 bg-amber-100/50 dark:bg-amber-900/10 rounded-t-xl">
          <Zap size={16} className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 tracking-wide">
            {t('quickList')}
          </span>
        </div>
        <div className="p-4 text-amber-600/60 dark:text-amber-400/60 text-sm text-center flex-1 flex items-center justify-center">
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800/30 flex items-center gap-2 flex-shrink-0 bg-amber-100/50 dark:bg-amber-900/10 rounded-t-xl">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <Zap size={16} className="text-amber-600 dark:text-amber-400" />
        </motion.div>
        <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 tracking-wide">
          {t('quickList')}
        </span>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        {items.length === 0 ? (
          <div className="p-6 text-center text-amber-600/60 dark:text-amber-400/60 text-sm">
            {t('quickListEmpty')}
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-3 py-2 mb-1 flex items-center gap-2 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded-lg transition-colors group bg-white/50 dark:bg-gray-800/30"
              >
                {editingId === item.id ? (
                  // Edit mode
                  <>
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleEditKeyPress}
                      className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-1.5 py-1 outline-none focus:border-indigo-500"
                    >
                      <option value="low">{t('priorityLow')}</option>
                      <option value="normal">{t('priorityNormal')}</option>
                      <option value="high">{t('priorityHigh')}</option>
                    </select>
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-500 hover:text-green-600"
                      aria-label={t('save')}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      aria-label={t('cancel')}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  // View mode
                  <>
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
                    {/* Priority indicator */}
                    {!item.done && (
                      <Circle 
                        size={8} 
                        className={`${getPriorityColorClass(item.priority || 'normal')} fill-current flex-shrink-0`} 
                        title={t(`priority${(item.priority || 'normal').charAt(0).toUpperCase() + (item.priority || 'normal').slice(1)}`)} 
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
                    {/* Action buttons - only show for non-done items */}
                    {!item.done && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-gray-400 hover:text-indigo-500"
                          aria-label={t('editQuickItem')}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleArchive(item.id)}
                          className="p-1 text-gray-400 hover:text-yellow-500"
                          aria-label={t('archiveQuickItem')}
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          aria-label={t('deleteQuickItem')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    {/* Priority selector - only show for done items */}
                    {item.done && (
                      <select
                        value={item.priority || 'normal'}
                        onChange={(e) => updateItemPriority(item.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                        aria-label={t('labelPriority')}
                      >
                        <option value="low">{t('priorityLow')}</option>
                        <option value="normal">{t('priorityNormal')}</option>
                        <option value="high">{t('priorityHigh')}</option>
                      </select>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add Item Input */}
      <div className="px-4 py-3 border-t border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 flex-shrink-0 rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('quickListPlaceholder')}
            className="flex-1 border border-amber-300 dark:border-amber-700 dark:bg-amber-950/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 bg-white dark:text-gray-200"
            aria-label={t('quickListPlaceholder')}
          />
          <select
            value={newItemPriority}
            onChange={(e) => setNewItemPriority(e.target.value)}
            className="text-xs border border-amber-300 dark:border-amber-700 dark:bg-amber-950/30 rounded-lg px-2 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 bg-white dark:text-gray-200"
            aria-label={t('labelPriority')}
          >
            <option value="low">{t('priorityLow')}</option>
            <option value="normal">{t('priorityNormal')}</option>
            <option value="high">{t('priorityHigh')}</option>
          </select>
          <button
            onClick={handleAdd}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm transition-colors"
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

