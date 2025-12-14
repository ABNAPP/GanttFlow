// Quick List Section in Dashboard
import { memo } from 'react';
import { Zap, Plus, ArrowRight, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuickList } from '../../hooks/useQuickList';

export const QuickListSection = memo(({ user, t, onOpenQuickList, onConvertToTask }) => {
  const { items, loading, toggleItem } = useQuickList(user);
  const activeItems = items.filter(item => !item.done && !item.archived && !item.deleted);
  const displayItems = activeItems.slice(0, 5);

  if (!user) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl shadow-sm p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </motion.div>
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
            {t('quickListTitle') || 'Snabba tankar'}
          </h3>
          {activeItems.length > 0 && (
            <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeItems.length}
            </span>
          )}
        </div>
        {activeItems.length > 0 && (
          <button
            onClick={onOpenQuickList}
            className="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 flex items-center gap-1 font-medium"
          >
            {t('viewAll') || 'Visa alla'}
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="text-center text-amber-600/60 dark:text-amber-400/60 text-sm py-4">
          {t('loading')}
        </div>
      ) : activeItems.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-amber-700/70 dark:text-amber-300/70 text-sm mb-3">
            {t('quickListEmpty') || 'Lägg till din första tanke...'}
          </p>
          <button
            onClick={onOpenQuickList}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            {t('addQuickItem') || 'Lägg till'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/40 rounded-lg border border-amber-200/50 dark:border-amber-800/30 hover:bg-white dark:hover:bg-gray-800/60 transition-colors group"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="flex-shrink-0"
                aria-label={item.done ? t('markAsIncomplete') : t('markAsComplete')}
              >
                <CheckSquare
                  size={18}
                  className={item.done ? 'text-amber-600 dark:text-amber-400 fill-current' : 'text-amber-400 dark:text-amber-600'}
                />
              </button>
              <span className="flex-1 text-sm text-amber-900 dark:text-amber-200">
                {item.text}
              </span>
              {onConvertToTask && (
                <button
                  onClick={() => onConvertToTask(item)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 font-medium transition-opacity px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                  <ArrowRight size={12} />
                  {t('convertToTask') || 'Gör till uppgift'}
                </button>
              )}
            </motion.div>
          ))}
          {activeItems.length > 5 && (
            <div className="text-center pt-2">
              <button
                onClick={onOpenQuickList}
                className="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 font-medium"
              >
                +{activeItems.length - 5} {t('more') || 'mer'} {t('viewAll') || 'Visa alla'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

QuickListSection.displayName = 'QuickListSection';

