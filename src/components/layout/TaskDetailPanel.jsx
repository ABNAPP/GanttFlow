// Task Detail Panel - Right side panel for task details
import { memo, useEffect } from 'react';
import { X, Calendar, User, Tag, FileText, MessageSquare, AlertTriangle } from 'lucide-react';
import { getTaskOverallStatus, calculateChecklistProgress, getTaskDisplayStatus } from '../../utils/helpers';
import { sanitizeText } from '../../utils/sanitize';

export const TaskDetailPanel = memo(({
  task,
  isOpen,
  onClose,
  onEdit,
  warningThreshold,
  t,
  lang,
}) => {
  // DEV-log: verify comments are present (localhost only)
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost' && task) {
      console.log('[TaskDetailPanel render] comments length:', task.comments?.length);
      console.log('[TaskDetailPanel render] comments data:', task.comments);
    }
  }, [task]);
  
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e) => {
      const panel = document.getElementById('task-detail-panel');
      if (panel && !panel.contains(e.target)) {
        // Don't close if clicking on a button that opens the panel
        if (!e.target.closest('[data-task-id]')) {
          onClose();
        }
      }
    };
    
    // Small delay to avoid closing immediately when opening
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const { isOverdue, isWarning } = getTaskOverallStatus(task, warningThreshold);
  const progress = calculateChecklistProgress(task.checklist || []);

  return (
    <div
      id="task-detail-panel"
      className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-lg z-20 transition-all duration-300"
    >
      {/* Header */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate flex-1" dangerouslySetInnerHTML={{ __html: sanitizeText(task.title) }} />
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 flex-shrink-0"
          aria-label={t('close') || 'Close'}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status & Warning */}
        {(isOverdue || isWarning) && (
          <div className={`p-3 rounded-lg border ${
            isOverdue 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle 
                size={16} 
                className={isOverdue ? 'text-red-500' : 'text-orange-500'} 
              />
              <span className={`text-sm font-medium ${
                isOverdue ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'
              }`}>
                {isOverdue ? t('statusLate') : t('warning')}
              </span>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar size={16} className="flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {t('startDate') || 'Start Date'}
              </div>
              <div>{task.startDate || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar size={16} className="flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {t('endDate') || 'End Date'}
              </div>
              <div className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                {task.endDate || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('status') || 'Status'}
            </div>
            {(() => {
              // Use display status (may be 'Försenad' if overdue)
              const { status: displayStatus } = getTaskDisplayStatus(task);
              return (
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  displayStatus === 'Klar'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : displayStatus === 'Pågående'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : displayStatus === 'Försenad'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {displayStatus}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Progress */}
        {task.checklist && task.checklist.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {t('progress') || 'Progress'}
              </span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {/* Roles */}
        {(task.assignee || task.executor || task.cad || task.reviewer || task.agent || task.be || task.pl) && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t('assignments') || 'Assignments'}
            </div>
            <div className="space-y-1">
              {task.assignee && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">UA:</span>
                  <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeText(task.assignee) }} />
                </div>
              )}
              {task.executor && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">HL:</span>
                  <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeText(task.executor) }} />
                </div>
              )}
              {task.cad && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">CAD:</span>
                  <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeText(task.cad) }} />
                </div>
              )}
              {task.reviewer && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">G:</span>
                  <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeText(task.reviewer) }} />
                </div>
              )}
              {task.agent && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">O:</span>
                  <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeText(task.agent) }} />
                </div>
              )}
              {task.be && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">BE:</span>
                  <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeText(task.be) }} />
                </div>
              )}
              {task.pl && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">PL:</span>
                  <span className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeText(task.pl) }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments */}
        {task.comments && task.comments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <MessageSquare size={16} />
              <span>{t('labelComments') || 'Comments'}</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 rounded-full">
                {task.comments.length}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {task.comments.map((comment, idx) => (
                <div
                  key={comment.id || idx}
                  className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs"
                >
                  <div className="text-gray-500 dark:text-gray-400 mb-1">
                    {comment.author && <span dangerouslySetInnerHTML={{ __html: sanitizeText(comment.author) }} />}
                    {comment.author && <span> • </span>}
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString(lang === 'sv' ? 'sv-SE' : 'en-US') : (comment.date ? new Date(comment.date).toLocaleString(lang === 'sv' ? 'sv-SE' : 'en-US') : '')}
                  </div>
                  <div className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeText(comment.text) }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Preview */}
        {task.checklist && task.checklist.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('checklist') || 'Checklist'} ({task.checklist.filter(item => item.done).length}/{task.checklist.length})
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {task.checklist.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-2 text-xs p-1.5 bg-gray-50 dark:bg-gray-700/30 rounded"
                >
                  <div className={`w-3 h-3 rounded border ${
                    item.done
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`} />
                  <span className={`flex-1 ${
                    item.done
                      ? 'line-through text-gray-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`} dangerouslySetInnerHTML={{ __html: sanitizeText(item.text) }} />
                </div>
              ))}
              {task.checklist.length > 5 && (
                <div className="text-xs text-gray-400 text-center py-1">
                  +{task.checklist.length - 5} {t('more') || 'more'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {t('editTask') || 'Edit Task'}
        </button>
      </div>
    </div>
  );
});

TaskDetailPanel.displayName = 'TaskDetailPanel';

