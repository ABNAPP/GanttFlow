import { memo, useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, AlertTriangle, Briefcase, CheckSquare, Tag, MessageSquare, X } from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { getTimeStatus, calculateChecklistProgress, getTaskDisplayStatus } from '../../utils/helpers';

export const TaskItem = memo(({
  task,
  isExpanded,
  warningThreshold,
  onToggleExpand,
  onEdit,
  onQuickStatusChange,
  onChecklistToggle,
  isSelected,
  t,
}) => {
  // DEV-log: verify comments are present (localhost only)
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('[TaskItem render] comments length:', task.comments?.length);
  }
  
  const [openCommentsForTaskId, setOpenCommentsForTaskId] = useState(null);
  const commentsPopupRef = useRef(null);
  const commentsButtonRef = useRef(null);
  
  const progress = calculateChecklistProgress(task.checklist);
  const { isOverdue, isWarning } = getTimeStatus(task, warningThreshold);
  const hasSubtasks = task.checklist && task.checklist.length > 0;
  const hasComments = task.comments && task.comments.length > 0;
  
  // Close popup when clicking outside or pressing ESC
  useEffect(() => {
    if (openCommentsForTaskId !== task.id) return;
    
    const handleClickOutside = (event) => {
      if (
        commentsPopupRef.current &&
        !commentsPopupRef.current.contains(event.target) &&
        commentsButtonRef.current &&
        !commentsButtonRef.current.contains(event.target)
      ) {
        setOpenCommentsForTaskId(null);
      }
    };
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenCommentsForTaskId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openCommentsForTaskId, task.id]);
  
  const toggleCommentsPopup = (e) => {
    e.stopPropagation();
    if (openCommentsForTaskId === task.id) {
      setOpenCommentsForTaskId(null);
    } else {
      setOpenCommentsForTaskId(task.id);
    }
  };
  
  // Sort comments by createdAt descending (newest first)
  const sortedComments = hasComments
    ? [...task.comments].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
    : [];
  
  const displayComments = sortedComments.slice(0, 5);

  return (
    <div className="border-b border-gray-50 dark:border-gray-700/50">
      <div
        onClick={() => onEdit(task)}
        className={`p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors group relative ${
          isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500' : ''
        }`}
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
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* NOTE: Priority exists ONLY on subtasks (checklist items), NOT on main tasks */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {task.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-[9px]"
                  >
                    <Tag size={8} />
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-[9px] text-gray-500 dark:text-gray-400">+{task.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
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
                  aria-label={isExpanded ? t('collapseSubtasks') : t('expandSubtasks')}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {(isOverdue || isWarning) && (
                <AlertTriangle
                  size={12}
                  className={isOverdue ? 'text-red-500' : 'text-amber-500'}
                  aria-label={isOverdue ? t('statusLate') : t('warning')}
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

            <div className="flex items-center gap-1.5">
              {/* Comments Icon */}
              {hasComments && (
                <div className="relative">
                  <button
                    ref={commentsButtonRef}
                    onClick={toggleCommentsPopup}
                    className="p-1 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
                    aria-label={t('labelComments') || 'Kommentarer'}
                    title={`${task.comments.length} ${t('labelComments') || 'kommentarer'}`}
                  >
                    <MessageSquare size={14} />
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {task.comments.length}
                    </span>
                  </button>
                  
                  {/* Comments Popup */}
                  {openCommentsForTaskId === task.id && (
                    <div
                      ref={commentsPopupRef}
                      className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[1000] max-h-80 overflow-hidden flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Popup Header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                          {t('labelComments') || 'Kommentarer'}
                        </h4>
                        <button
                          onClick={() => setOpenCommentsForTaskId(null)}
                          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          aria-label={t('close') || 'Stäng'}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      {/* Comments List */}
                      <div className="overflow-y-auto flex-1 p-2">
                        {displayComments.length > 0 ? (
                          <div className="space-y-2">
                            {displayComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs border border-gray-100 dark:border-gray-600"
                              >
                                <p className="text-gray-700 dark:text-gray-200 mb-1 whitespace-pre-wrap break-words">
                                  {comment.text}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {comment.author || 'Användare'} •{' '}
                                  {comment.createdAt
                                    ? new Date(comment.createdAt).toLocaleString('sv-SE', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </p>
                              </div>
                            ))}
                            {sortedComments.length > 5 && (
                              <div className="text-center pt-1 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {t('showing') || 'Visar'} 5 {t('of') || 'av'} {sortedComments.length}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                            {t('noComments') || 'Inga kommentarer'}
                          </p>
                        )}
                      </div>
                      
                      {/* Footer with "Open Task" button */}
                      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCommentsForTaskId(null);
                            onEdit(task);
                          }}
                          className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors"
                          aria-label={t('openTask') || 'Öppna uppgift'}
                        >
                          {t('openTask') || 'Öppna uppgift'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Status Dropdown */}
            <div onClick={(e) => e.stopPropagation()} className="relative">
                {(() => {
                  // Use display status (may be 'Försenad' if overdue)
                  const { status: displayStatus } = getTaskDisplayStatus(task);
                  return (
              <select
                      value={displayStatus}
                onChange={(e) => onQuickStatusChange(e, task.id)}
                className={`text-[9px] py-0.5 pl-1 pr-0 rounded-sm border-2 cursor-pointer appearance-none outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500 ${
                        displayStatus === 'Försenad' ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ maxWidth: '70px' }}
                aria-label={`Change status for ${task.title}`}
              >
                      {displayStatus === 'Försenad' ? (
                        <>
                          <option value="Försenad">{t('statusLate')}</option>
                          <option value="Planerad">{t('statusPlan')}</option>
                          <option value="Pågående">{t('statusProg')}</option>
                          <option value="Klar">{t('statusDone')}</option>
                        </>
                ) : (
                  <>
                    <option value="Planerad">{t('statusPlan')}</option>
                    <option value="Pågående">{t('statusProg')}</option>
                    <option value="Klar">{t('statusDone')}</option>
                    <option value="Försenad">{t('statusLate')}</option>
                  </>
                )}
              </select>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1 pl-4">
          <RoleBadge label="UA" value={task.assignee} />
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
                aria-label={`${t('progress')}: ${progress}%`}
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
                    aria-label={item.done ? t('markAsIncomplete') : t('markAsComplete')}
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
                      title={subStatus.isOverdue ? t('statusLate') : t('approachingDeadline')}
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

