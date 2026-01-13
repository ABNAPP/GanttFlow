// Split View Component - Gantt + Tasks side by side
import { memo, useState, useEffect, Suspense } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Sidebar } from '../layout/Sidebar';
import { GanttTimeline } from '../gantt/GanttTimeline';
import { ErrorBoundary } from '../common/ErrorBoundary';

export const SplitView = memo(({
  tasks,
  processedTasks,
  loading,
  searchTerm,
  onlyMyTasks,
  sortOption,
  expandedTaskIds,
  warningThreshold,
  viewStart,
  viewDays,
  zoomLevel,
  showChecklistInGantt,
  dragState,
  dragMovedRef,
  onToggleExpand,
  onTaskClick,
  onQuickStatusChange,
  onChecklistToggle,
  onSearchChange,
  onOnlyMyTasksToggle,
  onSortChange,
  onDragStart,
  onScrollTimeline,
  scrollToTask,
  t,
  lang,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Sync scroll - when task is selected in list, scroll Gantt to it
  useEffect(() => {
    if (selectedTaskId && scrollToTask) {
      scrollToTask(selectedTaskId);
    }
  }, [selectedTaskId, scrollToTask]);

  const handleTaskClick = (task) => {
    setSelectedTaskId(task.id);
    onTaskClick(task);
  };

  return (
    <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
      {/* Left Panel - Tasks List */}
      <Panel defaultSize={40} minSize={30} maxSize={60} className="flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <Sidebar
          isOpen={true}
          tasks={processedTasks}
          loading={loading}
          searchTerm={searchTerm}
          onlyMyTasks={onlyMyTasks}
          sortOption={sortOption}
          expandedTaskIds={expandedTaskIds}
          warningThreshold={warningThreshold}
          onToggleExpand={onToggleExpand}
          onEdit={handleTaskClick}
          onQuickStatusChange={onQuickStatusChange}
          onChecklistToggle={onChecklistToggle}
          onSearchChange={onSearchChange}
          onOnlyMyTasksToggle={onOnlyMyTasksToggle}
          onSortChange={onSortChange}
          selectedTaskId={selectedTaskId}
          isInSplitView={true}
          t={t}
        />
      </Panel>

      {/* Resize Handle */}
      <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-indigo-400 dark:hover:bg-indigo-600 transition-colors cursor-col-resize" />

      {/* Right Panel - Gantt */}
      <Panel defaultSize={60} minSize={40} maxSize={70} className="flex flex-col overflow-hidden">
        <ErrorBoundary t={t}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">{t('loading')}...</div>
            </div>
          }>
            <GanttTimeline
              tasks={processedTasks}
              viewStart={viewStart}
              viewDays={viewDays}
              zoomLevel={zoomLevel}
              warningThreshold={warningThreshold}
              showChecklistInGantt={showChecklistInGantt}
              dragState={dragState}
              dragMovedRef={dragMovedRef}
              onDragStart={onDragStart}
              onTaskClick={handleTaskClick}
              onScrollTimeline={onScrollTimeline}
              selectedTaskId={selectedTaskId}
              t={t}
              lang={lang}
            />
          </Suspense>
        </ErrorBoundary>
      </Panel>
    </PanelGroup>
  );
});

SplitView.displayName = 'SplitView';

