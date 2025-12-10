import { useMemo, memo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { getDaysArray, getTimeStatus, calculateChecklistProgress, isRedDay, getStatusColor } from '../../utils/helpers';
import { ZOOM_LEVELS } from '../../constants';

// Helper function to calculate task style
const getTaskStyle = (task, timelineStartDate, cellWidth, dragState) => {
  let start = new Date(task.startDate);
  let end = new Date(task.endDate);

  if (dragState && dragState.taskId === task.id) {
    const diffPixels = dragState.currentX - dragState.startX;
    const daysMoved = Math.round(diffPixels / cellWidth);
    start = new Date(dragState.originalStart);
    start.setDate(start.getDate() + daysMoved);
    end = new Date(dragState.originalEnd);
    end.setDate(end.getDate() + daysMoved);
  }

  const diffTime = start - timelineStartDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const isMilestone = durationDays <= 1 && start.getTime() === end.getTime();

  return {
    left: `${diffDays * cellWidth}px`,
    width: isMilestone ? '24px' : `${durationDays * cellWidth}px`,
    isMilestone,
  };
};

export const GanttTimeline = memo(({
  tasks,
  viewStart,
  viewDays,
  zoomLevel,
  warningThreshold,
  showChecklistInGantt,
  dragState,
  dragMovedRef,
  onDragStart,
  onTaskClick,
  onScrollTimeline,
  t,
  lang,
}) => {
  const cellWidth = ZOOM_LEVELS[zoomLevel]?.cellWidth || 40;

  const timelineStartDate = new Date(viewStart);
  const timelineEndDate = new Date(viewStart);
  timelineEndDate.setDate(timelineEndDate.getDate() + viewDays);
  const timelineDays = getDaysArray(timelineStartDate, timelineEndDate);
  const today = new Date();
  const todayStr = today.toDateString();

  const getTaskStyleMemo = useCallback((task) => {
    return getTaskStyle(task, timelineStartDate, cellWidth, dragState);
  }, [timelineStartDate, cellWidth, dragState]);

  const scrollTimeline = (days) => {
    const newDate = new Date(viewStart);
    newDate.setDate(newDate.getDate() + days);
    onScrollTimeline(newDate);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden relative transition-colors duration-300">
      <div className="h-10 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-white dark:bg-gray-800 select-none transition-colors duration-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollTimeline(-7)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold w-32 text-center uppercase tracking-wide text-gray-700 dark:text-gray-200 capitalize">
            {timelineStartDate.toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-US', {
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={() => scrollTimeline(7)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500 flex gap-3">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-sm" />
            <span className="hidden sm:inline">{t('statusDone')}</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-sm" />
            <span className="hidden sm:inline">{t('statusProg')}</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-sm" />
            <span className="hidden sm:inline">{t('statusPlan')}</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-sm" />
            <span className="hidden sm:inline">{t('settingWarnDays')}</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-sm" />
            <span className="hidden sm:inline">{t('statusLate')}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative custom-scrollbar bg-white dark:bg-gray-900">
        <div className="relative" style={{ minWidth: 'max-content' }}>
          <div className="flex sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-8 shadow-sm">
            {timelineDays.map((day, i) => {
              const isRed = isRedDay(day);
              const isToday = todayStr === day.toDateString();

              return (
                <div
                  key={i}
                  className={`flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col justify-center items-center text-[9px] relative group ${
                    isRed ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                  } ${
                    isToday
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  style={{ width: `${cellWidth}px` }}
                >
                  {zoomLevel !== 'month' && (
                    <span className="capitalize">
                      {day
                        .toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-US', { weekday: 'short' })
                        .replace('.', '')}
                    </span>
                  )}
                  <span>{day.getDate()}</span>
                </div>
              );
            })}
          </div>

          <div className="relative pb-20">
            <div className="absolute inset-0 flex pointer-events-none h-full">
              {timelineDays.map((day, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 border-r border-gray-100 dark:border-gray-800 h-full ${
                    isRedDay(day) ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                  } ${todayStr === day.toDateString() ? 'bg-blue-50/20 dark:bg-blue-500/5' : ''}`}
                  style={{ width: `${cellWidth}px` }}
                />
              ))}
            </div>

            {Object.entries(tasks).map(([phase, groupTasks]) => (
              <div key={phase}>
                <div className="h-8 flex items-center border-b border-dashed border-gray-200 dark:border-gray-700 px-2 sticky left-0 z-10 w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px]">
                  <span className="text-[9px] font-bold text-indigo-300 dark:text-indigo-500 uppercase tracking-widest">
                    {phase}
                  </span>
                </div>

                {groupTasks.map((task) => {
                  const style = getTaskStyleMemo(task);
                  const { isOverdue, isWarning } = getTimeStatus(task, warningThreshold);
                  const progress = calculateChecklistProgress(task.checklist);

                  return (
                    <div
                      key={task.id}
                      className="relative h-[40px] border-b border-gray-50/50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <div
                        className={`absolute top-2 h-6 shadow-sm cursor-grab active:cursor-grabbing flex items-center justify-center text-white text-[10px] z-10 group-hover:brightness-95 transition-all select-none overflow-hidden ${getStatusColor(
                          task.status,
                          style.isMilestone,
                          isOverdue
                        )}`}
                        style={{
                          left: style.left,
                          width: style.width,
                          transform: style.isMilestone ? 'translateY(2px) rotate(45deg)' : 'none',
                        }}
                        onMouseDown={(e) => onDragStart(e, task)}
                        onTouchStart={(e) => onDragStart(e, task)}
                        onClick={() => {
                          if (!dragMovedRef.current) {
                            onTaskClick(task);
                          }
                        }}
                        title={`${task.title}\n${task.startDate} -> ${task.endDate}\n${task.description}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Task: ${task.title}`}
                      >
                        {!style.isMilestone && isWarning && (
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-orange-500 z-20"
                            style={{
                              width: `${warningThreshold * cellWidth}px`,
                              maxWidth: '100%',
                            }}
                          />
                        )}

                        {!style.isMilestone && zoomLevel !== 'month' && (
                          <div className="flex items-center gap-1 px-2 truncate w-full relative z-30">
                            {(isOverdue || isWarning) && (
                              <AlertTriangle
                                size={12}
                                className="text-white shrink-0 fill-current animate-pulse"
                                aria-label={isOverdue ? t('statusLate') : t('warning')}
                              />
                            )}
                            <span className="truncate pointer-events-none">{task.title}</span>
                          </div>
                        )}
                      </div>

                      {showChecklistInGantt && !style.isMilestone && task.checklist && task.checklist.length > 0 && (
                        <div
                          className="absolute top-[30px] h-1 bg-gray-200 dark:bg-gray-700 rounded-full pointer-events-none"
                          style={{
                            left: style.left,
                            width: style.width,
                          }}
                        >
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${progress}%` }}
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Today Line */}
            {(() => {
              const diffDays = (today - timelineStartDate) / (1000 * 60 * 60 * 24);
              if (diffDays >= 0 && diffDays <= viewDays) {
                return (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-red-500 z-50 pointer-events-none"
                    style={{ left: `${diffDays * cellWidth}px` }}
                  >
                    <div className="bg-red-500 text-white text-[8px] px-1 rounded absolute top-0 -left-4 font-bold">
                      {t('today')}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
});

GanttTimeline.displayName = 'GanttTimeline';

