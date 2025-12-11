// FiltersBar component for advanced filtering
import { memo, useState } from 'react';
import { Filter, X, Save, Trash2 } from 'lucide-react';

export const FiltersBar = memo(({
  tasks,
  filters,
  onFiltersChange,
  onClearFilters,
  onSaveView,
  savedViews,
  onLoadView,
  onDeleteView,
  zoomLevel,
  onZoomChange,
  t,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveView, setShowSaveView] = useState(false);
  const [viewName, setViewName] = useState('');

  // Get unique values for dropdowns
  const uniqueClients = [...new Set(tasks.map(t => t.client).filter(Boolean))].sort();
  const uniquePhases = [...new Set(tasks.map(t => t.phase).filter(Boolean))].sort();
  const uniqueTags = [...new Set(tasks.flatMap(t => (t.tags || [])).filter(Boolean))].sort();
  const statuses = [
    { value: 'Planerad', label: 'statusPlan' },
    { value: 'Pågående', label: 'statusProg' },
    { value: 'Klar', label: 'statusDone' },
    { value: 'Försenad', label: 'statusLate' },
  ];
  const roles = ['UA', 'HL', 'CAD', 'G', 'O', 'BE', 'PL', t('roleOther')];

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    const view = {
      name: viewName.trim(),
      filters: { ...filters },
      zoomLevel,
      timestamp: Date.now(),
    };
    onSaveView(view);
    setViewName('');
    setShowSaveView(false);
  };

  const hasActiveFilters = Object.values(filters).some(v => 
    Array.isArray(v) ? v.length > 0 : v !== null && v !== ''
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
            aria-label={t('filters')}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">{t('filters')}</span>
            {hasActiveFilters && (
              <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v !== null && v !== '').length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              aria-label={t('clearFilters')}
            >
              <X size={14} />
              <span>{t('clearFilters')}</span>
            </button>
          )}

          {/* Saved Views */}
          {savedViews && savedViews.length > 0 && (
            <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-2 sm:pl-3 hidden sm:flex">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const view = savedViews.find(v => v.name === e.target.value);
                    if (view) onLoadView(view);
                    e.target.value = '';
                  }
                }}
                className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="">{t('savedViews')}...</option>
                {savedViews.map((view) => (
                  <option key={view.name} value={view.name}>
                    {view.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowSaveView(!showSaveView)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-600 rounded"
            title={t('saveViewAs')}
          >
            <Save size={14} />
            <span className="hidden sm:inline">{t('saveView')}</span>
          </button>
        </div>

        {/* Save View Input */}
        {showSaveView && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveView()}
              placeholder={t('viewName')}
              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-500"
              autoFocus
            />
            <button
              onClick={handleSaveView}
              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t('save')}
            </button>
            <button
              onClick={() => {
                setShowSaveView(false);
                setViewName('');
              }}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400"
            >
              {t('cancel')}
            </button>
          </div>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Client Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {t('filterClient')}
            </label>
            <select
              value={filters.client || ''}
              onChange={(e) => onFiltersChange({ ...filters, client: e.target.value || null })}
              className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
            >
              <option value="">{t('all')}</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>

          {/* Phase Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {t('filterPhase')}
            </label>
            <select
              value={filters.phase || ''}
              onChange={(e) => onFiltersChange({ ...filters, phase: e.target.value || null })}
              className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
            >
              <option value="">{t('all')}</option>
              {uniquePhases.map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {t('filterStatus')}
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || null })}
              className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
            >
              <option value="">{t('all')}</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {t(status.label)}
                </option>
              ))}
            </select>
          </div>

          {/* Roles Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {t('filterRoles')}
            </label>
            <div className="flex flex-wrap gap-1">
              {roles.map((role) => (
                <label key={role} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(filters.roles || []).includes(role)}
                    onChange={(e) => {
                      const currentRoles = filters.roles || [];
                      const newRoles = e.target.checked
                        ? [...currentRoles, role]
                        : currentRoles.filter(r => r !== role);
                      onFiltersChange({ ...filters, roles: newRoles.length > 0 ? newRoles : null });
                    }}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{role}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {uniqueTags.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                {t('filterTags')}
              </label>
              <select
                value={filters.tag || ''}
                onChange={(e) => onFiltersChange({ ...filters, tag: e.target.value || null })}
                className="w-full text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="">{t('all')}</option>
                {uniqueTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Saved Views List */}
      {savedViews && savedViews.length > 0 && showFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('savedViews')}:</div>
          <div className="flex flex-wrap gap-2">
            {savedViews.map((view) => (
              <div
                key={view.name}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs"
              >
                <button
                  onClick={() => onLoadView(view)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {view.name}
                </button>
                <button
                  onClick={() => onDeleteView(view.name)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={t('deleteView')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

FiltersBar.displayName = 'FiltersBar';

