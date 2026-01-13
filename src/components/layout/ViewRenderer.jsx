/**
 * ViewRenderer - Handles rendering of different views (dashboard, gantt, tasks, quicklist, terms)
 * Extracted from App.jsx to reduce complexity
 */
import { Suspense, lazy } from 'react';
import { SkeletonLoader } from '../common/SkeletonLoader';

// Lazy loaded views
const Dashboard = lazy(() => import('../dashboard/Dashboard').then(module => ({ default: module.Dashboard })));
const GanttTimeline = lazy(() => import('../gantt/GanttTimeline').then(module => ({ default: module.GanttTimeline })));
const SplitView = lazy(() => import('../views/SplitView').then(module => ({ default: module.SplitView })));
const QuickListView = lazy(() => import('../views/QuickListView').then(module => ({ default: module.QuickListView })));
const TermsView = lazy(() => import('../views/TermsView').then(module => ({ default: module.TermsView })));
const Sidebar = lazy(() => import('./Sidebar').then(module => ({ default: module.Sidebar })));

const LoadingFallback = ({ t, variant = 'default' }) => {
  if (variant === 'dashboard') {
    return (
      <div className="p-6 space-y-4">
        <SkeletonLoader variant="card" count={3} className="mb-4" />
        <SkeletonLoader variant="card" count={2} />
      </div>
    );
  }
  
  if (variant === 'sidebar') {
    return (
      <div className="p-4 space-y-2">
        <SkeletonLoader variant="task" count={5} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mb-2"></div>
        <div className="text-gray-500 dark:text-gray-400">{t('loading')}...</div>
      </div>
    </div>
  );
};

export const ViewRenderer = ({
  currentView,
  ganttViewMode,
  tasks,
  processedTasks,
  loading,
  authLoading,
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
  selectedTask,
  user,
  onOpenArchive,
  onOpenTrash,
  t,
  lang,
}) => {
  if (currentView === 'dashboard') {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={<LoadingFallback t={t} variant="dashboard" />}>
          <Dashboard 
            tasks={tasks} 
            t={t} 
            onTaskClick={onTaskClick}
            warningThreshold={warningThreshold}
          />
        </Suspense>
      </div>
    );
  }

  if (currentView === 'gantt') {
    return (
      <Suspense fallback={<LoadingFallback t={t} />}>
        {ganttViewMode === 'split' ? (
          <SplitView
            tasks={tasks}
            processedTasks={processedTasks}
            loading={authLoading || loading}
            searchTerm={searchTerm}
            onlyMyTasks={onlyMyTasks}
            sortOption={sortOption}
            expandedTaskIds={expandedTaskIds}
            warningThreshold={warningThreshold}
            viewStart={viewStart}
            viewDays={viewDays}
            zoomLevel={zoomLevel}
            showChecklistInGantt={showChecklistInGantt}
            dragState={dragState}
            dragMovedRef={dragMovedRef}
            onToggleExpand={onToggleExpand}
            onTaskClick={onTaskClick}
            onQuickStatusChange={onQuickStatusChange}
            onChecklistToggle={onChecklistToggle}
            onSearchChange={onSearchChange}
            onOnlyMyTasksToggle={onOnlyMyTasksToggle}
            onSortChange={onSortChange}
            onDragStart={onDragStart}
            onScrollTimeline={onScrollTimeline}
            scrollToTask={null}
            t={t}
            lang={lang}
          />
        ) : ganttViewMode === 'list' ? (
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
            <Suspense fallback={<LoadingFallback t={t} variant="sidebar" />}>
              <Sidebar
                isOpen={true}
                tasks={processedTasks}
                loading={authLoading || loading}
                searchTerm={searchTerm}
                onlyMyTasks={onlyMyTasks}
                sortOption={sortOption}
                expandedTaskIds={expandedTaskIds}
                warningThreshold={warningThreshold}
                onToggleExpand={onToggleExpand}
                onEdit={onTaskClick}
                onQuickStatusChange={onQuickStatusChange}
                onChecklistToggle={onChecklistToggle}
                onSearchChange={onSearchChange}
                onOnlyMyTasksToggle={onOnlyMyTasksToggle}
                onSortChange={onSortChange}
                isInSplitView={false}
                t={t}
              />
            </Suspense>
          </div>
        ) : (
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
            onTaskClick={onTaskClick}
            onScrollTimeline={onScrollTimeline}
            selectedTaskId={selectedTask?.id}
            t={t}
            lang={lang}
          />
        )}
      </Suspense>
    );
  }

  if (currentView === 'tasks') {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          {t('tasks')} {t('view') || 'View'}
        </div>
      </div>
    );
  }

  if (currentView === 'quicklist') {
    return (
      <Suspense fallback={<LoadingFallback t={t} />}>
        <QuickListView
          user={user}
          t={t}
          onOpenArchive={onOpenArchive}
          onOpenTrash={onOpenTrash}
        />
      </Suspense>
    );
  }

  if (currentView === 'terms') {
    return (
      <Suspense fallback={<LoadingFallback t={t} />}>
        <TermsView
          t={t}
          lang={lang}
        />
      </Suspense>
    );
  }

  return null;
};
