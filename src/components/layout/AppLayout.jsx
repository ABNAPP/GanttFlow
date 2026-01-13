/**
 * AppLayout - Main layout component
 * Extracted from App.jsx to reduce complexity
 */
import { Sidebar } from './Sidebar';
import { NavigationSidebar } from './NavigationSidebar';
import { TaskDetailPanel } from './TaskDetailPanel';
import { ViewRenderer } from './ViewRenderer';
import { BREAKPOINTS } from '../../constants';

export const AppLayout = ({
  // Sidebar states
  isSidebarOpen,
  isNavigationSidebarOpen,
  isTaskDetailPanelOpen,
  
  // View state
  currentView,
  ganttViewMode,
  
  // Tasks data
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
  selectedTask,
  
  // Handlers
  onToggleSidebar,
  onToggleNavigationSidebar,
  onTaskClick,
  onToggleExpand,
  onQuickStatusChange,
  onChecklistToggle,
  onSearchChange,
  onOnlyMyTasksToggle,
  onSortChange,
  onDragStart,
  onScrollTimeline,
  onViewChange,
  onOpenArchive,
  onOpenTrash,
  onOpenSettings,
  onCloseTaskDetailPanel,
  onEditTask,
  
  // Other
  user,
  t,
  lang,
}) => {
  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Navigation Sidebar (Left) */}
      <NavigationSidebar
        isOpen={isNavigationSidebarOpen}
        currentView={currentView}
        onViewChange={onViewChange}
        onToggle={onToggleNavigationSidebar}
        onOpenArchive={onOpenArchive}
        onOpenTrash={onOpenTrash}
        onOpenSettings={onOpenSettings}
        t={t}
      />

      {/* Main Content Area */}
      <ViewRenderer
        currentView={currentView}
        ganttViewMode={ganttViewMode}
        tasks={tasks}
        processedTasks={processedTasks}
        loading={loading}
        authLoading={authLoading}
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
        selectedTask={selectedTask}
        user={user}
        onOpenArchive={onOpenArchive}
        onOpenTrash={onOpenTrash}
        t={t}
        lang={lang}
      />

      {/* Task Detail Panel (Right) */}
      <TaskDetailPanel
        task={selectedTask}
        isOpen={isTaskDetailPanelOpen && !!selectedTask}
        onClose={onCloseTaskDetailPanel}
        onEdit={onEditTask}
        warningThreshold={warningThreshold}
        t={t}
        lang={lang}
      />
    </div>
  );
};
