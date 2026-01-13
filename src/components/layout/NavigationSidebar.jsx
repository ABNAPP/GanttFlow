// Navigation Sidebar - Left side navigation for views
import { memo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Zap, 
  Archive, 
  Trash2, 
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';

export const NavigationSidebar = memo(({
  isOpen,
  currentView,
  onViewChange,
  onToggle,
  onOpenArchive,
  onOpenTrash,
  onOpenSettings,
  t,
}) => {
  const views = [
    { id: 'dashboard', icon: BarChart3, label: t('dashboard') },
    { id: 'gantt', icon: Calendar, label: t('tasks') },
    { id: 'quicklist', icon: Zap, label: t('quickList') },
    { id: 'terms', icon: FileText, label: t('terms') },
  ];

  const secondaryItems = [
    { id: 'archive', icon: Archive, label: t('archive'), onClick: onOpenArchive },
    { id: 'trash', icon: Trash2, label: t('trash'), onClick: onOpenTrash },
    { id: 'settings', icon: Settings, label: t('settings'), onClick: onOpenSettings },
  ];

  if (!isOpen) {
    return (
      <div className="w-12 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2 z-30 transition-colors duration-300">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 mb-2"
          aria-label={t('showSidebar')}
        >
          <ChevronRight size={20} />
        </button>
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`p-2 mb-1 rounded-md transition-colors ${
                currentView === view.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={view.label}
              aria-label={view.label}
              aria-pressed={currentView === view.id}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-sm z-30 transition-colors duration-300">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
          {t('navigation') || 'Navigation'}
        </h2>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
          aria-label={t('hideSidebar')}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Views */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 mb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            {t('views') || 'Views'}
          </span>
        </div>
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-md transition-colors ${
                currentView === view.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              aria-pressed={currentView === view.id}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm">{view.label}</span>
            </button>
          );
        })}

        {/* Separator */}
        <div className="my-4 px-2">
          <div className="border-t border-gray-200 dark:border-gray-700" />
        </div>

        {/* Secondary Items */}
        <div className="px-2 mb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            {t('secondary') || 'Secondary'}
          </span>
        </div>
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

NavigationSidebar.displayName = 'NavigationSidebar';

