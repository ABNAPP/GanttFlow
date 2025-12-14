// Persistent Mini-widget for Quick List (bottom-right)
import { memo, useState, useEffect, useRef } from 'react';
import { Zap, Plus, X, ArrowRight, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuickList } from '../../hooks/useQuickList';

export const QuickListWidget = memo(({ user, t, onOpenFullView }) => {
  const { items, loading, addItem, toggleItem } = useQuickList(user);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const inputRef = useRef(null);
  const widgetRef = useRef(null);

  const activeItems = items.filter(item => !item.done && !item.archived && !item.deleted);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleAdd = () => {
    if (newItemText.trim()) {
      addItem(newItemText, 'normal');
      setNewItemText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  if (!user) return null;

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ width: 56, height: 56, opacity: 0 }}
            animate={{ width: 320, height: 'auto', opacity: 1 }}
            exit={{ width: 56, height: 56, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-amber-200 dark:border-amber-800/30 flex items-center justify-between items-center bg-amber-100/50 dark:bg-amber-900/10">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {t('quickList')}
                </span>
                {activeItems.length > 0 && (
                  <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {activeItems.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-800/30 rounded transition-colors"
                aria-label={t('close')}
              >
                <X size={16} className="text-amber-700 dark:text-amber-300" />
              </button>
            </div>

            {/* Input */}
            <div className="p-3 border-b border-amber-200 dark:border-amber-800/30 bg-white/50 dark:bg-gray-800/30">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('quickListPlaceholder')}
                  className="flex-1 border border-amber-300 dark:border-amber-700 dark:bg-amber-950/30 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 bg-white dark:text-gray-200"
                />
                <button
                  onClick={handleAdd}
                  className="bg-amber-600 hover:bg-amber-700 text-white p-1.5 rounded-lg transition-colors"
                  aria-label={t('addQuickItem')}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-[300px] overflow-y-auto p-2">
              {loading ? (
                <div className="text-center text-amber-600/60 dark:text-amber-400/60 text-xs py-4">
                  {t('loading')}
                </div>
              ) : activeItems.length === 0 ? (
                <div className="text-center text-amber-600/60 dark:text-amber-400/60 text-xs py-4">
                  {t('quickListEmpty')}
                </div>
              ) : (
                <div className="space-y-1">
                  {activeItems.slice(0, 5).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/40 rounded-lg hover:bg-white dark:hover:bg-gray-800/60 transition-colors group"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex-shrink-0"
                        aria-label={item.done ? t('markAsIncomplete') : t('markAsComplete')}
                      >
                        <CheckSquare
                          size={14}
                          className={item.done ? 'text-amber-600 dark:text-amber-400 fill-current' : 'text-amber-400 dark:text-amber-600'}
                        />
                      </button>
                      <span className="flex-1 text-xs text-amber-900 dark:text-amber-200 truncate">
                        {item.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {activeItems.length > 5 && (
              <div className="px-3 py-2 border-t border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/10">
                <button
                  onClick={onOpenFullView}
                  className="w-full flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 font-medium py-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  {t('viewAll') || 'Visa alla'} ({activeItems.length})
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg flex items-center justify-center relative transition-colors"
            aria-label={t('quickList')}
          >
            <Zap size={24} />
            {activeItems.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {activeItems.length > 9 ? '9+' : activeItems.length}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

QuickListWidget.displayName = 'QuickListWidget';

