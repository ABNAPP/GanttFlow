// Header component
// Source: Extracted from src/GanttApp.jsx (lines 356-517)
import React, { memo, useState } from 'react';
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
  Download,
  LogOut,
  Menu,
  X,
  List,
  Layout,
  Split,
} from 'lucide-react';

export const Header = memo(({
  isSidebarOpen,
  lang,
  darkMode,
  zoomLevel,
  searchTerm,
  onlyMyTasks,
  isDashboardOpen,
  tasksCount,
  ganttViewMode,
  onToggleSidebar,
  onToggleTheme,
  onToggleLang,
  onZoomChange,
  onSearchChange,
  onOnlyMyTasksToggle,
  onOpenArchive,
  onOpenTrash,
  onOpenSettings,
  onToggleDashboard,
  onGanttViewModeChange,
  onNewTask,
  onExportCSV,
  onLogout,
  t,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm z-30 relative transition-colors duration-300 w-full">
      {/* Top Row - Always Visible - Scrollable on Mobile */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto sm:overflow-x-visible sm:justify-between scrollbar-hide w-full sm:w-auto" style={{ minWidth: 'max-content' }}>
        {/* Left Side - Logo, Title, Sidebar Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sidebar Toggle - Hidden (moved to sidebar navigation) */}
          {false && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
              title={isSidebarOpen ? t('hideSidebar') : t('showSidebar')}
              aria-label={isSidebarOpen ? t('hideSidebar') : t('showSidebar')}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} className="sm:w-5 sm:h-5" /> : <PanelLeftOpen size={18} className="sm:w-5 sm:h-5" />}
            </button>
          )}

          <div className="bg-indigo-600 p-1 sm:p-1.5 rounded-lg flex-shrink-0 hidden sm:block">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-shrink-0">
            <h1 className="text-sm sm:text-lg font-bold text-gray-800 dark:text-white leading-tight whitespace-nowrap">
              {t('title')}
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium hidden sm:block whitespace-nowrap">
              v3.7 • {tasksCount} {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 whitespace-nowrap">
          {/* Mobile Search Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 sm:hidden rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Desktop Search */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1.5 border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all flex-shrink-0">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent outline-none text-sm w-32 md:w-64 placeholder:text-gray-400 dark:text-gray-200"
              aria-label={t('searchPlaceholder')}
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden lg:inline">
              Q {t('forQuickList') || 'för snabblista'}
            </span>
          </div>

          {/* Desktop: Language & Theme */}
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600 flex-shrink-0">
            <button
              onClick={onToggleLang}
              className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
              title={t('switchLanguage')}
              aria-label="Switch language"
            >
              <Languages size={16} />
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-500 mx-1" />
            <button
              onClick={onToggleTheme}
              className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
              title={t('theme')}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* Desktop: View Mode Toggle (only in Gantt view) */}
          {!isDashboardOpen && onGanttViewModeChange && (
            <div className="hidden md:flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0">
              <button
                onClick={() => onGanttViewModeChange('list')}
                className={`p-1.5 rounded-md ${
                  ganttViewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title={t('viewList') || 'Lista'}
                aria-label={t('viewList') || 'Lista'}
                aria-pressed={ganttViewMode === 'list'}
              >
                <List size={14} />
              </button>
              <button
                onClick={() => onGanttViewModeChange('split')}
                className={`p-1.5 rounded-md ${
                  ganttViewMode === 'split'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title={t('viewSplit') || 'Delad'}
                aria-label={t('viewSplit') || 'Delad'}
                aria-pressed={ganttViewMode === 'split'}
              >
                <Split size={14} />
              </button>
              <button
                onClick={() => onGanttViewModeChange('gantt')}
                className={`p-1.5 rounded-md ${
                  ganttViewMode === 'gantt'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title={t('viewGantt') || 'Gantt'}
                aria-label={t('viewGantt') || 'Gantt'}
                aria-pressed={ganttViewMode === 'gantt'}
              >
                <Layout size={14} />
              </button>
            </div>
          )}

          {/* Desktop: Zoom Controls */}
          <div className="hidden md:flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0">
            <button
              onClick={() => onZoomChange('day')}
              className={`p-1.5 rounded-md ${
                zoomLevel === 'day'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              aria-label={t('dayView')}
              aria-pressed={zoomLevel === 'day'}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => onZoomChange('week')}
              className={`p-1.5 rounded-md ${
                zoomLevel === 'week'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              aria-label={t('weekView')}
              aria-pressed={zoomLevel === 'week'}
            >
              <Calendar size={14} />
            </button>
            <button
              onClick={() => onZoomChange('month')}
              className={`p-1.5 rounded-md ${
                zoomLevel === 'month'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              aria-label={t('monthView')}
              aria-pressed={zoomLevel === 'month'}
            >
              <ZoomOut size={14} />
            </button>
          </div>

          {/* Desktop: Action Icons */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                title={t('exportCSV')}
                aria-label={t('exportCSV')}
              >
                <Download size={18} />
              </button>
            )}
            {/* Archive - Hidden (moved to sidebar navigation) */}
            {false && (
              <button
                onClick={onOpenArchive}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                title={t('archive')}
                aria-label={t('archive')}
              >
                <Archive size={18} />
              </button>
            )}
            {/* Trash - Hidden (moved to sidebar navigation) */}
            {false && (
              <button
                onClick={onOpenTrash}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                title={t('trash')}
                aria-label={t('trash')}
              >
                <Trash2 size={18} />
              </button>
            )}
            {/* Settings - Hidden (moved to sidebar navigation) */}
            {false && (
              <button
                onClick={onOpenSettings}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                title={t('settings')}
                aria-label={t('settings')}
              >
                <Settings size={18} />
              </button>
            )}
            {/* Dashboard/Statistics - Hidden (moved to sidebar navigation) */}
            {false && (
              <button
                onClick={onToggleDashboard}
                className={`p-2 rounded-md text-gray-600 dark:text-gray-300 ${
                  isDashboardOpen 
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={t('dashboard')}
                aria-label={t('dashboard')}
              >
                <BarChart3 size={18} />
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
                title={t('authLogout') || 'Logga ut'}
                aria-label={t('authLogout') || 'Logga ut'}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>

          {/* New Task Button - Always Visible */}
          <button
            onClick={onNewTask}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-sm transition-colors flex-shrink-0"
            aria-label={t('newTask')}
          >
            <Plus size={14} className="sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">{t('newTask')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu - Expandable */}
      {mobileMenuOpen && (
        <div className="w-full sm:hidden mt-2 pb-2 border-t border-gray-200 dark:border-gray-700 pt-2">
          {/* Mobile Search */}
          <div className="mb-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-2 border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-gray-400 dark:text-gray-200"
                aria-label={t('searchPlaceholder')}
              />
            </div>
          </div>

          {/* Mobile: Language, Theme, Zoom */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button
              onClick={onOnlyMyTasksToggle}
              className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${
                onlyMyTasks
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
              }`}
              aria-label={t('myTasks')}
              aria-pressed={onlyMyTasks}
            >
              {t('myTasks')}
            </button>

            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
              <button
                onClick={onToggleLang}
                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                title={t('switchLanguage')}
                aria-label="Switch language"
              >
                <Languages size={16} />
              </button>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-500 mx-1" />
              <button
                onClick={onToggleTheme}
                className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
                title={t('theme')}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => onZoomChange('day')}
                className={`p-1.5 rounded-md ${
                  zoomLevel === 'day'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                aria-label={t('dayView')}
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => onZoomChange('week')}
                className={`p-1.5 rounded-md ${
                  zoomLevel === 'week'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                aria-label={t('weekView')}
              >
                <Calendar size={14} />
              </button>
              <button
                onClick={() => onZoomChange('month')}
                className={`p-1.5 rounded-md ${
                  zoomLevel === 'month'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                aria-label={t('monthView')}
              >
                <ZoomOut size={14} />
              </button>
            </div>
          </div>

          {/* Mobile: Action Icons Grid */}
          <div className="grid grid-cols-4 gap-2">
            {onExportCSV && (
              <button
                onClick={() => { onExportCSV(); setMobileMenuOpen(false); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 flex flex-col items-center gap-1"
                title={t('exportCSV')}
                aria-label={t('exportCSV')}
              >
                <Download size={18} />
                <span className="text-[10px]">{t('exportCSV')}</span>
              </button>
            )}
            {/* Archive - Hidden (moved to sidebar navigation) */}
            {false && (
              <button
                onClick={() => { onOpenArchive(); setMobileMenuOpen(false); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 flex flex-col items-center gap-1"
                title={t('archive')}
                aria-label={t('archive')}
              >
                <Archive size={18} />
                <span className="text-[10px]">{t('archive')}</span>
              </button>
            )}
            {/* Trash - Hidden (moved to sidebar navigation) */}
            {false && (
              <button
                onClick={() => { onOpenTrash(); setMobileMenuOpen(false); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 flex flex-col items-center gap-1"
                title={t('trash')}
                aria-label={t('trash')}
              >
                <Trash2 size={18} />
                <span className="text-[10px]">{t('trash')}</span>
              </button>
            )}
            {/* Settings - Hidden (moved to sidebar navigation) */}
            {false && (
              <button
                onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 flex flex-col items-center gap-1"
                title={t('settings')}
                aria-label={t('settings')}
              >
                <Settings size={18} />
                <span className="text-[10px]">{t('settings')}</span>
              </button>
            )}
            {/* Dashboard/Statistics - Hidden (moved to sidebar navigation) */}
            {false && (
              <button
                onClick={() => { onToggleDashboard(); setMobileMenuOpen(false); }}
                className={`p-2 rounded-md text-gray-600 dark:text-gray-300 flex flex-col items-center gap-1 ${
                  isDashboardOpen 
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={t('dashboard')}
                aria-label={t('dashboard')}
              >
                <BarChart3 size={18} />
                <span className="text-[10px]">{t('dashboard')}</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 flex flex-col items-center gap-1"
                title={t('authLogout') || 'Logga ut'}
                aria-label={t('authLogout') || 'Logga ut'}
              >
                <LogOut size={18} />
                <span className="text-[10px]">{t('authLogout') || 'Logga ut'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

