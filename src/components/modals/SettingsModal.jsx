import { useEffect, memo } from 'react';
import { X, Settings, Database, Save, Cloud, Download, Upload } from 'lucide-react';
import { showSuccess } from '../../utils/toast';

export const SettingsModal = memo(({
  isOpen,
  onClose,
  warningThreshold,
  showChecklistInGantt,
  onWarningThresholdChange,
  onShowChecklistChange,
  cloudBackups,
  loadingBackups,
  onCreateCloudBackup,
  onRestoreCloudBackup,
  onExportData,
  onImportClick,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 id="settings-title" className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" /> {t('settings')}
          </h2>
          <button onClick={onClose} aria-label={t('cancel')}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Allmänt</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settingWarnDays')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="14"
                  value={warningThreshold}
                  onChange={(e) => onWarningThresholdChange(parseInt(e.target.value, 10))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  aria-label={t('settingWarnDays')}
                  aria-valuenow={warningThreshold}
                  aria-valuemin={0}
                  aria-valuemax={14}
                />
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-8 text-center">
                  {warningThreshold}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Varning visas {warningThreshold} dagar innan deadline.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settingShowChecklist')}
              </label>
              <button
                onClick={() => onShowChecklistChange(!showChecklistInGantt)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  showChecklistInGantt ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={showChecklistInGantt}
                aria-label={t('settingShowChecklist')}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    showChecklistInGantt ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3 h-3" /> {t('settingCloudTitle')}
            </h3>
            <button
              onClick={onCreateCloudBackup}
              className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-md text-sm font-medium transition-colors"
              aria-label={t('settingCreateCloud')}
            >
              <Cloud size={16} /> {t('settingCreateCloud')}
            </button>
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('settingCloudList')}</p>
              {loadingBackups ? (
                <div className="text-center text-xs text-gray-400 py-2">{t('loading')}</div>
              ) : cloudBackups.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-2 italic">Inga moln-kopior.</div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {cloudBackups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 text-xs"
                    >
                      <span className="text-gray-600 dark:text-gray-300">
                        {new Date(backup.timestamp).toLocaleString()}{' '}
                        <span className="text-gray-400">({backup.taskCount} uppgifter)</span>
                      </span>
                      <button
                        onClick={() => onRestoreCloudBackup(backup)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        aria-label={t('restore')}
                      >
                        {t('restore')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Save className="w-3 h-3" /> {t('settingDataTitle')}
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={onExportData}
                className="flex items-center justify-center gap-2 w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium transition-colors"
                aria-label={t('settingBackup')}
              >
                <Download size={16} /> {t('settingBackup')}
              </button>
              <button
                onClick={onImportClick}
                className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-600 dark:text-gray-400 rounded-md text-sm font-medium transition-colors"
                aria-label={t('settingRestore')}
              >
                <Upload size={16} /> {t('settingRestore')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

