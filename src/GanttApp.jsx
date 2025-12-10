import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Calendar,
  Search,
  Moon,
  Sun,
  Languages,
  Settings,
  Archive,
  Trash2,
  BarChart3,
  ZoomIn,
  ZoomOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useDragAndDrop } from './hooks/useDragAndDrop';

// Components
import { Sidebar } from './components/Sidebar';
import { GanttChart } from './components/GanttChart';
import { TaskModal } from './components/TaskModal';
import { SettingsModal } from './components/SettingsModal';
import { ArchiveModal } from './components/ArchiveModal';
import { TrashModal } from './components/TrashModal';
import { Dashboard } from './components/Dashboard';

// Utils & Config
import { TRANSLATIONS } from './translations';
import { ZOOM_LEVELS, DEFAULT_VIEW_DAYS, DEFAULT_WARNING_THRESHOLD, BREAKPOINTS } from './constants';
import { checkIsDone, formatDate, getDaysArray } from './utils/helpers';
import { initToast, showError } from './utils/toast';

// Initialize toast on load
if (typeof window !== 'undefined') {
  initToast();
}

export default function GanttApp() {
  // Auth
  const { user, loading: authLoading } = useAuth();

  // Tasks
  const {
    tasks,
    loading,
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

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' && window.innerWidth > BREAKPOINTS.MOBILE
  );

  // Settings
  const [lang, setLang] = useState('sv');
  const [darkMode, setDarkMode] = useState(true);
  const [warningThreshold, setWarningThreshold] = useState(DEFAULT_WARNING_THRESHOLD);
  const [showChecklistInGantt, setShowChecklistInGantt] = useState(true);

  // Filters & View
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('startDate');
  const [zoomLevel, setZoomLevel] = useState('day');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

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

    const lowerSearch = searchTerm.toLowerCase();
    const phaseOther = TRANSLATIONS[lang]?.phaseOther || 'Other';

    let filtered = tasks.filter((task) => {
      if (task.deleted) return false;
      if (checkIsDone(task.status)) return false;

      const title = (task.title || '').toLowerCase();
      const executor = (task.executor || '').toLowerCase();
      const client = (task.client || '').toLowerCase();
      const phase = (task.phase || '').toLowerCase();

      const matchSearch =
        title.includes(lowerSearch) ||
        executor.includes(lowerSearch) ||
        client.includes(lowerSearch) ||
        phase.includes(lowerSearch);

      const matchMyTasks =
        !onlyMyTasks || (task.executor && ['jag', 'me', 'i'].includes(executor));

      return matchSearch && matchMyTasks;
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
  }, [tasks, searchTerm, onlyMyTasks, lang, sortOption]);

  // Archived tasks
  const archivedTasks = useMemo(
    () => tasks.filter((t) => checkIsDone(t.status) && !t.deleted),
    [tasks]
  );

  // Deleted tasks
  const deletedTasks = useMemo(() => tasks.filter((t) => t.deleted), [tasks]);


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
        // onSnapshot will automatically update the tasks list (or localStorage for demo)
        setIsModalOpen(false);
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      // Error is already shown by addTask/updateTask
      // Don't close modal on error so user can retry
      throw error; // Re-throw so TaskModal knows it failed
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

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center shadow-sm z-30 relative transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mr-1"
                title={isSidebarOpen ? 'Dölj meny' : 'Visa meny'}
                aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
              </button>

              <div className="bg-indigo-600 p-1.5 rounded-lg hidden md:block">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight truncate max-w-[120px] md:max-w-none">
                  {t('title')}
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium hidden md:block">
                  v3.7 • {tasks.length - archivedTasks.length - deletedTasks.length} {t('subtitle')}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block" />

            <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1.5 border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent outline-none text-sm w-32 md:w-64 placeholder:text-gray-400 dark:text-gray-200"
                aria-label={t('searchPlaceholder')}
              />
            </div>

            <button
              onClick={() => setOnlyMyTasks((prev) => !prev)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors hidden md:block ${
                onlyMyTasks
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              aria-label={t('myTasks')}
              aria-pressed={onlyMyTasks}
            >
              {t('myTasks')}
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
              <button
                onClick={toggleLang}
                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                title="Byt språk / Switch Language"
                aria-label="Switch language"
              >
                <Languages size={16} />
              </button>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-500 mx-1" />
              <button
                onClick={toggleTheme}
                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                title="Tema"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setZoomLevel('day')}
                className={`p-1.5 rounded-md ${
                  zoomLevel === 'day'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                aria-label="Day view"
                aria-pressed={zoomLevel === 'day'}
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel('week')}
                className={`p-1.5 rounded-md hidden sm:block ${
                  zoomLevel === 'week'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                aria-label="Week view"
                aria-pressed={zoomLevel === 'week'}
              >
                <Calendar size={14} />
              </button>
              <button
                onClick={() => setZoomLevel('month')}
                className={`p-1.5 rounded-md ${
                  zoomLevel === 'month'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                aria-label="Month view"
                aria-pressed={zoomLevel === 'month'}
              >
                <ZoomOut size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsArchiveOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                title={t('archive')}
                aria-label={t('archive')}
              >
                <Archive size={20} />
              </button>
              <button
                onClick={() => setIsTrashOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                title={t('trash')}
                aria-label={t('trash')}
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                title={t('settings')}
                aria-label={t('settings')}
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                className={`p-2 rounded-md text-gray-600 dark:text-gray-300 ${
                  isDashboardOpen 
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Dashboard"
                aria-label="Dashboard"
              >
                <BarChart3 size={20} />
              </button>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
              aria-label={t('newTask')}
            >
              <Plus size={16} /> <span className="hidden sm:inline">{t('newTask')}</span>
            </button>
          </div>
        </header>

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
              <Dashboard 
                tasks={tasks} 
                t={t} 
                onTaskClick={handleOpenModal}
                warningThreshold={warningThreshold}
              />
            </div>
          ) : (
            <GanttChart
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
          )}
        </div>

        {/* Modals */}
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
        />

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
    </div>
  );
}

