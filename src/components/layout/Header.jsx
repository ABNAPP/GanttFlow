// Header component
// Source: Extracted from src/GanttApp.jsx (lines 356-517)
import React, { memo } from 'react';
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
  onNewTask,
  onExportCSV,
  onLogout,
  t,
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center shadow-sm z-30 relative transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mr-1"
            title={isSidebarOpen ? t('hideSidebar') : t('showSidebar')}
            aria-label={isSidebarOpen ? t('hideSidebar') : t('showSidebar')}
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
              v3.7 • {tasksCount} {t('subtitle')}
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent outline-none text-sm w-32 md:w-64 placeholder:text-gray-400 dark:text-gray-200"
            aria-label={t('searchPlaceholder')}
          />
        </div>

        <button
          onClick={onOnlyMyTasksToggle}
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
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            aria-label={t('dayView')}
            aria-pressed={zoomLevel === 'day'}
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => onZoomChange('week')}
            className={`p-1.5 rounded-md hidden sm:block ${
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

        <div className="flex items-center gap-1">
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
              title={t('exportCSV')}
              aria-label={t('exportCSV')}
            >
              <Download size={20} />
            </button>
          )}
          <button
            onClick={onOpenArchive}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
            title={t('archive')}
            aria-label={t('archive')}
          >
            <Archive size={20} />
          </button>
          <button
            onClick={onOpenTrash}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
            title={t('trash')}
            aria-label={t('trash')}
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
            title={t('settings')}
            aria-label={t('settings')}
          >
            <Settings size={20} />
          </button>
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
            <BarChart3 size={20} />
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
              title={t('authLogout') || 'Logga ut'}
              aria-label={t('authLogout') || 'Logga ut'}
            >
              <LogOut size={20} />
            </button>
          )}
        </div>

        <button
          onClick={onNewTask}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
          aria-label={t('newTask')}
        >
          <Plus size={16} /> <span className="hidden sm:inline">{t('newTask')}</span>
        </button>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

