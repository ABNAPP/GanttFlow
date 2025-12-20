import { memo, useState, useEffect } from 'react';
import { Plus, Trash2, List, Circle, Edit2, Archive, X, Check, Zap, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuickList } from '../../hooks/useQuickList';
import { showSuccess } from '../../utils/toast';

export const QuickList = memo(({ user, t }) => {
  const { items, loading, addItem, deleteItem, archiveItem, updateItemPriority, updateItemText } = useQuickList(user);
  const [newItemText, setNewItemText] = useState('');
  const [newItemPriority, setNewItemPriority] = useState('normal');
  const [newItemType, setNewItemType] = useState('');
  const [newItemComment, setNewItemComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editType, setEditType] = useState('');
  const [editComment, setEditComment] = useState('');
  const [showComment, setShowComment] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Debug log
  useEffect(() => {
    console.log('[QuickList] Component rendered', { user: !!user, loading, itemsCount: items.length });
  }, [user, loading, items.length]);

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAdd = () => {
    try {
      if (newItemText && newItemText.trim()) {
        addItem(newItemText, newItemPriority, newItemType, newItemComment);
        setNewItemText('');
        setNewItemPriority('normal');
        setNewItemType('');
        setNewItemComment('');
      }
    } catch (error) {
      console.error('Error in handleAdd:', error);
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
    if (!item || !item.id) return;
    setEditingId(item.id);
    setEditText(item.text || '');
    setEditPriority(item.priority || 'normal');
    setEditType(item.type || '');
    setEditComment(item.comment || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditPriority('normal');
    setEditType('');
    setEditComment('');
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingId) {
      updateItemText(editingId, editText, editPriority, editType, editComment);
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
            {items.map((item) => {
              // Safety check: ensure item has required fields
              if (!item || !item.id) return null;
              
              return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-3 py-2 mb-1 flex items-center gap-2 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded-lg transition-colors group bg-white/50 dark:bg-gray-800/30"
              >
                {editingId === item.id ? (
                  // Edit mode
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2">
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
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-1.5 py-1 outline-none focus:border-indigo-500"
                      >
                        <option value="">{t('typeNone')}</option>
                        <option value="job">{t('typeJob')}</option>
                        <option value="private">{t('typePrivate')}</option>
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
                    </div>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 resize-none"
                      placeholder={t('commentPlaceholder')}
                      rows="2"
                    />
                  </div>
                ) : (
                  // View mode
                  <>
                    {/* Priority indicator */}
                    {item.priority && (
                      <Circle 
                        size={8} 
                        className={`${getPriorityColorClass(item.priority || 'normal')} fill-current flex-shrink-0`} 
                        title={t(`priority${(item.priority || 'normal').charAt(0).toUpperCase() + (item.priority || 'normal').slice(1)}`)} 
                      />
                    )}
                    {/* Type badge */}
                    {item.type && typeof item.type === 'string' && (item.type === 'job' || item.type === 'private') && (
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0 ${
                          item.type === 'job'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}
                        title={item.type === 'job' ? t('typeJob') : t('typePrivate')}
                      >
                        {item.type === 'job' ? '🟦' : '🟪'} {item.type === 'job' ? t('typeJob') : t('typePrivate')}
                      </span>
                    )}
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                      {item.text || ''}
                    </span>
                    {/* Comment icon */}
                    {item.comment && typeof item.comment === 'string' && item.comment.trim() && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMobile) {
                              setShowComment(prev => ({
                                ...prev,
                                [item.id]: !prev[item.id]
                              }));
                            }
                          }}
                          onMouseEnter={() => {
                            if (!isMobile) {
                              setShowComment(prev => ({
                                ...prev,
                                [item.id]: true
                              }));
                            }
                          }}
                          onMouseLeave={() => {
                            if (!isMobile) {
                              setShowComment(prev => ({
                                ...prev,
                                [item.id]: false
                              }));
                            }
                          }}
                          className="p-0.5 text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                          aria-label={t('labelComment')}
                          title={isMobile ? t('labelComment') : (item.comment || '')}
                        >
                          <MessageSquare size={12} />
                        </button>
                        {/* Comment Tooltip/Popup */}
                        {showComment[item.id] && item.comment && (
                          <div
                            className={`absolute z-50 ${
                              !isMobile
                                ? 'bottom-full right-0 mb-2'
                                : 'top-full right-0 mt-2'
                            } w-64 sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs text-gray-700 dark:text-gray-200`}
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={() => {
                              if (!isMobile) {
                                setShowComment(prev => ({
                                  ...prev,
                                  [item.id]: true
                                }));
                              }
                            }}
                            onMouseLeave={() => {
                              if (!isMobile) {
                                setShowComment(prev => ({
                                  ...prev,
                                  [item.id]: false
                                }));
                              }
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <MessageSquare size={14} className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                              <p className="whitespace-pre-wrap break-words">{item.comment || ''}</p>
                            </div>
                            {isMobile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowComment(prev => ({
                                    ...prev,
                                    [item.id]: false
                                  }));
                                }}
                                className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:underline"
                              >
                                {t('cancel')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Action buttons */}
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
                  </>
                )}
              </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Add Item Input */}
      <div className="px-4 py-3 border-t border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 flex-shrink-0 rounded-b-xl">
        <div className="flex flex-col gap-2">
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
            <select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value)}
              className="text-xs border border-amber-300 dark:border-amber-700 dark:bg-amber-950/30 rounded-lg px-2 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 bg-white dark:text-gray-200"
              aria-label={t('labelType')}
            >
              <option value="">{t('typeNone')}</option>
              <option value="job">{t('typeJob')}</option>
              <option value="private">{t('typePrivate')}</option>
            </select>
            <button
              onClick={handleAdd}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm transition-colors"
              aria-label={t('addQuickItem')}
            >
              <Plus size={14} />
            </button>
          </div>
          <textarea
            value={newItemComment}
            onChange={(e) => setNewItemComment(e.target.value)}
            className="flex-1 border border-amber-300 dark:border-amber-700 dark:bg-amber-950/30 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 bg-white dark:text-gray-200 resize-none"
            placeholder={t('commentPlaceholder')}
            rows="2"
            aria-label={t('labelComment')}
          />
        </div>
      </div>
    </div>
  );
});

QuickList.displayName = 'QuickList';

