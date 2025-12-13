// Main App component - Refactored from GanttApp.jsx
// Source: src/GanttApp.jsx
import { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useQuickList } from './hooks/useQuickList';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useTimeline } from './hooks/useTimeline';
import { useDebounce } from './hooks/useDebounce';

// Layout Components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { FiltersBar } from './components/common/FiltersBar';

// Feature Components - Lazy loaded for code splitting
const GanttTimeline = lazy(() => import('./components/gantt/GanttTimeline').then(module => ({ default: module.GanttTimeline })));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(module => ({ default: module.Dashboard })));

// Modal Components - Lazy loaded (only loaded when modals are opened)
const TaskModal = lazy(() => import('./components/modals/TaskModal').then(module => ({ default: module.TaskModal })));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal').then(module => ({ default: module.SettingsModal })));
const ArchiveModal = lazy(() => import('./components/modals/ArchiveModal').then(module => ({ default: module.ArchiveModal })));
const TrashModal = lazy(() => import('./components/modals/TrashModal').then(module => ({ default: module.TrashModal })));
const QuickListModal = lazy(() => import('./components/modals/QuickListModal').then(module => ({ default: module.QuickListModal })));
const QuickListArchiveModal = lazy(() => import('./components/modals/QuickListArchiveModal').then(module => ({ default: module.QuickListArchiveModal })));
const QuickListTrashModal = lazy(() => import('./components/modals/QuickListTrashModal').then(module => ({ default: module.QuickListTrashModal })));

// Utils & Config
import { TRANSLATIONS } from './constants/translations';
import { ZOOM_LEVELS, DEFAULT_VIEW_DAYS, DEFAULT_WARNING_THRESHOLD, BREAKPOINTS } from './constants';
import { checkIsDone, formatDate, getDaysArray } from './utils/helpers';
import { initToast, showError, showSuccess } from './utils/toast';
import { exportToCSV } from './utils/export';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ErrorDisplay } from './components/common/ErrorDisplay';
import { FirebaseHealthCheck } from './components/common/FirebaseHealthCheck';
import { DemoModeWarning } from './components/common/DemoModeWarning';
import { AuthScreen } from './components/common/AuthScreen';
import { isLocalDev } from './config/firebase';

// Initialize toast on load
if (typeof window !== 'undefined') {
  initToast();
}

export default function App() {
  // Auth
  const { user, loading: authLoading, register, login, logout } = useAuth();

  // Debug log when App mounts
  useEffect(() => {
    const isDev = isLocalDev();
    console.log(`[App] ${isDev ? 'LOCAL DEV' : 'PRODUCTION'} - App mounted, current user:`, 
      user ? `${user.uid} (${user.email || 'no email'})` : 'null');
  }, [user]);

  // Tasks
  const {
    tasks,
    archivedTasks,
    deletedTasks,
    loading,
    error: tasksError,
    retry: retryTasks,
    cloudBackups,
    loadingBackups,
    addTask,
    updateTask,
    deleteTask,
    permanentDeleteTask,
    restoreTask,
    restoreTaskStatus,
    fetchCloudBackups,
    createCloudBackup,
    restoreCloudBackup,
    exportData,
    importData,
    viewInitializedRef,
  } = useTasks(user);

  // Quick List
  const {
    archivedItems: quickListArchivedItems,
    deletedItems: quickListDeletedItems,
    restoreItem: restoreQuickListItem,
    permanentDeleteItem: permanentDeleteQuickListItem,
    deleteItem: deleteQuickListItem,
  } = useQuickList(user);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isQuickListOpen, setIsQuickListOpen] = useState(false);
  const [isQuickListArchiveOpen, setIsQuickListArchiveOpen] = useState(false);
  const [isQuickListTrashOpen, setIsQuickListTrashOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gantt-dashboard-open');
      return saved !== null ? saved === 'true' : true; // Default to true (Dashboard)
    }
    return true;
  });
  const [editingTask, setEditingTask] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' && window.innerWidth > BREAKPOINTS.MOBILE
  );

  // Settings
  const [lang, setLang] = useState('sv');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gantt-dark-mode');
      return saved !== null ? saved === 'true' : false; // Default to false (Light mode)
    }
    return false;
  });
  const [warningThreshold, setWarningThreshold] = useState(DEFAULT_WARNING_THRESHOLD);
  const [showChecklistInGantt, setShowChecklistInGantt] = useState(true);

  // Filters & View
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [sortOption, setSortOption] = useState('startDate');
  const [zoomLevel, setZoomLevel] = useState('day');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  
  // Use filter hook for filters and saved views
  const {
    filters,
    setFilters,
    clearFilters,
    savedViews,
    saveView,
    loadView,
    deleteView,
  } = useTaskFilters(tasks, lang);

  // View state
  const [viewStart, setViewStart] = useState(new Date());
  const [viewDays, setViewDays] = useState(DEFAULT_VIEW_DAYS);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);

  // Task expansion
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());

  // File input ref
  const fileInputRef = useRef(null);

  // Translations
  const t = useCallback((key) => TRANSLATIONS[lang][key] || key, [lang]);

  // Cell width based on zoom
  const cellWidth = ZOOM_LEVELS[zoomLevel]?.cellWidth || 40;

  // Drag & Drop
  const { dragState, handleDragStart, dragMovedRef } = useDragAndDrop(
    tasks,
    zoomLevel,
    cellWidth,
    updateTask
  );

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > BREAKPOINTS.MOBILE) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save darkMode to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gantt-dark-mode', String(darkMode));
    }
  }, [darkMode]);

  // Save dashboard state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gantt-dashboard-open', String(isDashboardOpen));
    }
  }, [isDashboardOpen]);

  // Initialize view when tasks load
  useEffect(() => {
    if (tasks.length > 0 && !viewInitializedRef.current) {
      const earliest = new Date(Math.min(...tasks.map((task) => new Date(task.startDate))));
      earliest.setDate(earliest.getDate() - 5);
      setViewStart(earliest);
      viewInitializedRef.current = true;
    }
  }, [tasks, viewInitializedRef]);

  // Fetch cloud backups when settings open
  useEffect(() => {
    if (isSettingsOpen) {
      fetchCloudBackups();
    }
  }, [isSettingsOpen, fetchCloudBackups]);

  // Process tasks (filter, sort, group)
  const processedTasks = useMemo(() => {
    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      console.warn('Tasks is not an array:', tasks);
      return {};
    }

    const lowerSearch = debouncedSearchTerm.toLowerCase();
    const phaseOther = TRANSLATIONS[lang]?.phaseOther || 'Other';

    let filtered = tasks.filter((task) => {
      if (task.deleted) return false;
      if (checkIsDone(task.status)) return false;

      const title = (task.title || '').toLowerCase();
      const client = (task.client || '').toLowerCase();
      const phase = (task.phase || '').toLowerCase();
      
      // Check executor in checklist items for search
      const checklistExecutors = (task.checklist || [])
        .map(item => (item.executor || '').toLowerCase())
        .filter(Boolean);
      const executorMatch = checklistExecutors.some(exec => exec.includes(lowerSearch));

      const matchSearch =
        title.includes(lowerSearch) ||
        executorMatch ||
        client.includes(lowerSearch) ||
        phase.includes(lowerSearch);

      const matchMyTasks =
        !onlyMyTasks || checklistExecutors.some(exec => ['jag', 'me', 'i'].includes(exec));

      // Apply advanced filters
      const matchClient = !filters.client || task.client === filters.client;
      const matchPhase = !filters.phase || task.phase === filters.phase;
      const matchStatus = !filters.status || task.status === filters.status;
      const matchTag = !filters.tag || (task.tags || []).includes(filters.tag);
      
      // Role filters
      let matchRoles = true;
      if (filters.roles && filters.roles.length > 0) {
        matchRoles = filters.roles.some(role => {
          if (role === 'HL') {
            // Check executor in checklist items
            return (task.checklist || []).some(item => item.executor && item.executor.trim() !== '');
          }
          const roleMap = {
            'UA': task.assignee,
            'CAD': task.cad,
            'G': task.reviewer,
            'O': task.agent,
            'BE': task.be,
            'PL': task.pl,
          };
          return roleMap[role] && roleMap[role].trim() !== '';
        });
      }

      return matchSearch && matchMyTasks && matchClient && matchPhase && matchStatus && matchTag && matchRoles;
    });

    // Apply sorting to tasks AND checklists
    filtered = filtered.map((task) => {
      const newTask = { ...task };
      if (newTask.checklist && newTask.checklist.length > 0) {
        const sortedChecklist = [...newTask.checklist];
        sortedChecklist.sort((a, b) => {
          if (sortOption === 'startDate') {
            const dateA = a.startDate ? new Date(a.startDate) : new Date(9999, 11, 31);
            const dateB = b.startDate ? new Date(b.startDate) : new Date(9999, 11, 31);
            return dateA - dateB;
          } else if (sortOption === 'endDate') {
            const dateA = a.endDate ? new Date(a.endDate) : new Date(9999, 11, 31);
            const dateB = b.endDate ? new Date(b.endDate) : new Date(9999, 11, 31);
            return dateA - dateB;
          } else if (sortOption === 'title') {
            return a.text.localeCompare(b.text);
          }
          return 0;
        });
        newTask.checklist = sortedChecklist;
      }
      return newTask;
    });

    filtered.sort((a, b) => {
      if (sortOption === 'startDate') {
        return new Date(a.startDate) - new Date(b.startDate);
      } else if (sortOption === 'endDate') {
        return new Date(a.endDate) - new Date(b.endDate);
      } else if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    const groups = {};
    filtered.forEach((task) => {
      const phaseKey = task.phase || phaseOther;
      if (!groups[phaseKey]) groups[phaseKey] = [];
      groups[phaseKey].push(task);
    });

    return groups;
  }, [tasks, debouncedSearchTerm, onlyMyTasks, lang, sortOption, filters]);

  // Handlers
  const handleOpenModal = useCallback((task = null) => {
    if (dragState) return;
    setEditingTask(task);
    setIsModalOpen(true);
  }, [dragState]);

  const handleSaveTask = useCallback(async (formData) => {
    console.log('handleSaveTask called:', { 
      authLoading, 
      hasUser: !!user, 
      userId: user?.uid,
      editingTask: !!editingTask 
    });

    // Wait for auth to be ready (but with timeout)
    if (authLoading) {
      console.log('Waiting for auth to complete...');
      // Wait max 1 second for auth
      let waited = 0;
      while (authLoading && waited < 1000) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waited += 100;
      }
      if (authLoading) {
        console.warn('Auth still loading after timeout, proceeding anyway');
      }
    }

    if (!user) {
      console.error('Cannot save task: No user after wait');
      showError('You must be logged in to save tasks. Please refresh the page.');
      return;
    }

    try {
      if (editingTask) {
        console.log('Updating task:', editingTask.id, formData);
        await updateTask(editingTask.id, formData);
        setIsModalOpen(false);
        setEditingTask(null);
      } else {
        console.log('Adding new task:', formData);
        await addTask(formData);
        setIsModalOpen(false);
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  }, [editingTask, updateTask, addTask, user, authLoading]);

  const handleDeleteTask = useCallback(async () => {
    if (editingTask) {
      await deleteTask(editingTask.id);
      setIsModalOpen(false);
      setEditingTask(null);
    }
  }, [editingTask, deleteTask]);

  const handleQuickStatusChange = useCallback(async (e, taskId) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    await updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  const handleSidebarChecklistToggle = useCallback(async (task, itemId) => {
    const updatedChecklist = task.checklist.map((item) => {
      if (item.id === itemId) return { ...item, done: !item.done };
      return item;
    });
    await updateTask(task.id, { checklist: updatedChecklist });
  }, [updateTask]);

  const toggleTaskExpansion = useCallback((taskId) => {
    setExpandedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handleEmptyTrash = useCallback(async () => {
    const promises = deletedTasks.map((task) => permanentDeleteTask(task.id));
    await Promise.all(promises);
    setConfirmEmptyTrash(false);
  }, [deletedTasks, permanentDeleteTask]);

  const handleImportClick = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.click();
  }, []);

  const handleImportData = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Import error:', error);
    }
    event.target.value = null;
  }, [importData]);

  const scrollTimeline = useCallback((newDate) => {
    setViewStart(newDate);
  }, []);

  const toggleTheme = useCallback(() => setDarkMode((d) => !d), []);
  const toggleLang = useCallback(() => setLang((prev) => (prev === 'sv' ? 'en' : 'sv')), []);

  // Filter handlers - now using useTaskFilters hook
  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  // Saved views handlers - now using useTaskFilters hook
  const handleSaveView = useCallback((view) => {
    saveView(view);
    showSuccess(t('viewSaved'));
  }, [saveView, t]);

  const handleLoadView = useCallback((viewName) => {
    const loadedZoom = loadView(viewName);
    if (loadedZoom) setZoomLevel(loadedZoom);
    showSuccess(t('viewLoaded'));
  }, [loadView, setZoomLevel, t]);

  const handleDeleteView = useCallback((viewName) => {
    deleteView(viewName);
    showSuccess(t('viewDeleted'));
  }, [deleteView, t]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    try {
      // Get filtered tasks (flatten from groups)
      const filteredTasks = Object.values(processedTasks).flat();
      exportToCSV(filteredTasks, t);
      showSuccess(t('exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      showError(t('exportError'));
    }
  }, [processedTasks, t]);

  // Calculate active tasks count for header
  const activeTasksCount = useMemo(() => {
    return tasks.length - archivedTasks.length - deletedTasks.length;
  }, [tasks, archivedTasks, deletedTasks]);

  return (
    <ErrorBoundary t={t}>
      {/* Firebase Health Check - runs diagnostic on mount */}
      <FirebaseHealthCheck 
        enabled={true}
        onStatusChange={(connected, error) => {
          if (connected) {
            console.log('[App] Firebase health check passed');
          } else {
            console.warn('[App] Firebase health check failed:', error);
          }
        }}
      />
      <div className={darkMode ? 'dark' : ''}>
        {/* Show loading screen while checking auth */}
        {authLoading ? (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t('loading') || 'Laddar...'}</p>
            </div>
          </div>
        ) : !user ? (
          /* Show AuthScreen if no user is logged in */
          (() => {
            const isDev = isLocalDev();
            console.log(`[UI] ${isDev ? 'LOCAL DEV' : 'PRODUCTION: AUTH REQUIRED'} - Rendering AuthScreen (no user - requires email/password login)`);
            return <AuthScreen onLogin={login} onRegister={register} t={t} />;
          })()
        ) : (() => {
          /* Reject demo users in production */
          const isDev = isLocalDev();
          if (!isDev && user?.uid?.startsWith('demo-user-')) {
            console.error('[UI] PRODUCTION: Rejecting demo user - AUTH REQUIRED');
            console.error('[UI] Demo mode is not allowed in production. Please log in with email/password.');
            // Sign out and show login screen
            logout();
            return <AuthScreen onLogin={login} onRegister={register} t={t} />;
          }
          
          /* Show main app if user is logged in */
          const mode = user?.uid?.startsWith('demo-user-') ? 'LOCAL DEMO MODE' : (isDev ? 'LOCAL DEV' : 'PRODUCTION');
          console.log(`[UI] ${mode} - Rendering main app for user:`, user?.uid, user?.email);
          return (
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300" style={{ overflowY: 'hidden' }}>
        {/* Demo Mode Warning */}
        <DemoModeWarning user={user} t={t} />
        {/* Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          lang={lang}
          darkMode={darkMode}
          zoomLevel={zoomLevel}
          searchTerm={searchTerm}
          onlyMyTasks={onlyMyTasks}
          isDashboardOpen={isDashboardOpen}
          tasksCount={activeTasksCount}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleTheme={toggleTheme}
          onToggleLang={toggleLang}
          onZoomChange={setZoomLevel}
          onSearchChange={setSearchTerm}
          onOnlyMyTasksToggle={() => setOnlyMyTasks((prev) => !prev)}
          onOpenArchive={() => setIsArchiveOpen(true)}
          onOpenTrash={() => setIsTrashOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleDashboard={() => {
            const newValue = !isDashboardOpen;
            setIsDashboardOpen(newValue);
            if (typeof window !== 'undefined') {
              localStorage.setItem('gantt-dashboard-open', String(newValue));
            }
          }}
          onNewTask={() => handleOpenModal()}
          onExportCSV={handleExportCSV}
          onLogout={logout}
          t={t}
        />

        {/* Filters Bar */}
        <FiltersBar
          tasks={tasks.filter(t => !t.deleted && !checkIsDone(t.status))}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          onSaveView={handleSaveView}
          savedViews={savedViews}
          onLoadView={handleLoadView}
          onDeleteView={handleDeleteView}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          user={user}
          onOpenQuickList={() => setIsQuickListOpen(true)}
          t={t}
        />

        {/* Main Area */}
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar
            isOpen={isSidebarOpen}
            tasks={processedTasks}
            loading={authLoading || loading}
            searchTerm={searchTerm}
            onlyMyTasks={onlyMyTasks}
            sortOption={sortOption}
            expandedTaskIds={expandedTaskIds}
            warningThreshold={warningThreshold}
            onToggleExpand={toggleTaskExpansion}
            onEdit={handleOpenModal}
            onQuickStatusChange={handleQuickStatusChange}
            onChecklistToggle={handleSidebarChecklistToggle}
            onSearchChange={setSearchTerm}
            onOnlyMyTasksToggle={setOnlyMyTasks}
            onSortChange={setSortOption}
            t={t}
          />

          {isDashboardOpen ? (
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 dark:text-gray-400">{t('loading')}...</div>
                </div>
              }>
                <Dashboard 
                  tasks={tasks} 
                  t={t} 
                  onTaskClick={handleOpenModal}
                  warningThreshold={warningThreshold}
                />
              </Suspense>
            </div>
          ) : (
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
                onDragStart={handleDragStart}
                onTaskClick={handleOpenModal}
                onScrollTimeline={scrollTimeline}
                t={t}
                lang={lang}
              />
            </Suspense>
          )}
        </div>

        {/* Modals - Lazy loaded */}
        {isModalOpen && (
          <Suspense fallback={null}>
            <TaskModal
              isOpen={isModalOpen}
              task={editingTask}
              onClose={() => {
                setIsModalOpen(false);
                setEditingTask(null);
              }}
              onSave={handleSaveTask}
              onDelete={handleDeleteTask}
              warningThreshold={warningThreshold}
              t={t}
              lang={lang}
            />
          </Suspense>
        )}

        {isSettingsOpen && (
          <Suspense fallback={null}>
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              warningThreshold={warningThreshold}
              showChecklistInGantt={showChecklistInGantt}
              onWarningThresholdChange={setWarningThreshold}
              onShowChecklistChange={setShowChecklistInGantt}
              cloudBackups={cloudBackups}
              loadingBackups={loadingBackups}
              onCreateCloudBackup={createCloudBackup}
              onRestoreCloudBackup={restoreCloudBackup}
              onExportData={exportData}
              onImportClick={handleImportClick}
              t={t}
            />
          </Suspense>
        )}

        {isArchiveOpen && (
          <Suspense fallback={null}>
            <ArchiveModal
              isOpen={isArchiveOpen}
              onClose={() => setIsArchiveOpen(false)}
              archivedTasks={archivedTasks}
              onRestore={restoreTaskStatus}
              onDelete={deleteTask}
              confirmDeleteId={confirmDeleteId}
              onSetConfirmDeleteId={setConfirmDeleteId}
              t={t}
            />
          </Suspense>
        )}

        {isTrashOpen && (
          <Suspense fallback={null}>
            <TrashModal
              isOpen={isTrashOpen}
              onClose={() => setIsTrashOpen(false)}
              deletedTasks={deletedTasks}
              onRestore={restoreTask}
              onPermanentDelete={permanentDeleteTask}
              confirmDeleteId={confirmDeleteId}
              confirmEmptyTrash={confirmEmptyTrash}
              onSetConfirmDeleteId={setConfirmDeleteId}
              onSetConfirmEmptyTrash={setConfirmEmptyTrash}
              onEmptyTrash={handleEmptyTrash}
              t={t}
            />
          </Suspense>
        )}

        {isQuickListOpen && (
          <Suspense fallback={null}>
            <QuickListModal
              isOpen={isQuickListOpen}
              onClose={() => setIsQuickListOpen(false)}
              user={user}
              t={t}
              onOpenArchive={() => {
                setIsQuickListOpen(false);
                setIsQuickListArchiveOpen(true);
              }}
              onOpenTrash={() => {
                setIsQuickListOpen(false);
                setIsQuickListTrashOpen(true);
              }}
            />
          </Suspense>
        )}

        {isQuickListArchiveOpen && (
          <Suspense fallback={null}>
            <QuickListArchiveModal
              isOpen={isQuickListArchiveOpen}
              onClose={() => setIsQuickListArchiveOpen(false)}
              archivedItems={quickListArchivedItems}
              onRestore={(id) => {
                restoreQuickListItem(id);
                showSuccess(t('quickListItemRestored'));
              }}
              onDelete={(id) => {
                deleteQuickListItem(id);
                showSuccess(t('quickListItemDeleted'));
              }}
              t={t}
            />
          </Suspense>
        )}

        {isQuickListTrashOpen && (
          <Suspense fallback={null}>
            <QuickListTrashModal
              isOpen={isQuickListTrashOpen}
              onClose={() => setIsQuickListTrashOpen(false)}
              deletedItems={quickListDeletedItems}
              onRestore={(id) => {
                restoreQuickListItem(id);
                showSuccess(t('quickListItemRestored'));
              }}
              onPermanentDelete={(id) => {
                permanentDeleteQuickListItem(id);
                showSuccess(t('quickListItemPermanentlyDeleted'));
              }}
              t={t}
            />
          </Suspense>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportData}
          accept=".json"
          className="hidden"
          aria-label="Import file"
        />
            </div>
          );
        })()}
      </div>
    </ErrorBoundary>
  );
}

