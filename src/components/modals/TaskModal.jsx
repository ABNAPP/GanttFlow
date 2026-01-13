import { useState, useEffect, useRef } from 'react';
import { memo } from 'react';
import { X, Trash2, Check, XCircle, Plus } from 'lucide-react';
import { formatDate, validateTaskForm, getTaskDisplayStatus } from '../../utils/helpers';
import { showError, showSuccess } from '../../utils/toast';
import { validateAndSanitizeInput } from '../../utils/sanitize';
import { logger } from '../../utils/logger';
import { TaskCommentsSection } from './TaskCommentsSection';
import { TaskChecklistSection } from './TaskChecklistSection';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { STATUSES } from '../../constants';

export const TaskModal = memo(({
  isOpen,
  task,
  onClose,
  onSave,
  onDelete,
  warningThreshold,
  t,
  lang = 'sv',
}) => {
  const [formData, setFormData] = useState({
    client: '',
    title: '',
    phase: '',
    assignee: '',
    cad: '',
    reviewer: '',
    agent: '',
    be: '',
    pl: '',
    other: '',
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 5))),
    status: STATUSES.PLANERAD,
    checklist: [],
    tags: [],
    comments: [],
  });
  const [newTag, setNewTag] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const modalRef = useRef(null);

  // Focus trap for keyboard navigation
  useFocusTrap(isOpen, modalRef);

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      logger.logWithPrefix('TaskModal', 'Loading task with comments:', task.comments);
      
      // Get display status (may be 'Försenad' if overdue, but we store original task.status)
      const { status: displayStatus, reason } = getTaskDisplayStatus(task);
      
      // Debug logging (only in development, localhost)
      if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        logger.logWithPrefix('TaskModal Debug', 'Task loaded:', {
          'task.status (raw)': task.status,
          'getTaskDisplayStatus(task).status (display)': displayStatus,
          'getTaskDisplayStatus(task).reason': reason,
          'task.startDate': task.startDate,
          'task.endDate': task.endDate,
        });
      }
      
      setFormData({
        client: task.client || '',
        title: task.title || '',
        phase: task.phase || '',
        assignee: task.assignee || '',
        cad: task.cad || '',
        reviewer: task.reviewer || '',
        agent: task.agent || '',
        be: task.be || '',
        pl: task.pl || '',
        other: task.other || '',
        startDate: task.startDate || formatDate(new Date()),
        endDate: task.endDate || formatDate(new Date()),
        // Use display status for UI dropdown (shows 'Försenad' if overdue)
        status: displayStatus, // Show display status in dropdown
        checklist: task.checklist || [],
        tags: task.tags || [],
        comments: task.comments || [],
        // Store original status separately so we can restore it if user doesn't change status
        _originalStatus: task.status || STATUSES.PLANERAD, // Internal: original task.status
        _displayStatusReason: reason, // Internal: why display status differs (if dateOverdue)
      });
    } else {
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 5);
      setFormData({
        client: '',
        title: '',
        phase: '',
        assignee: '',
        cad: '',
        reviewer: '',
        agent: '',
        be: '',
        pl: '',
        other: '',
        startDate: formatDate(today),
        endDate: formatDate(end),
        status: STATUSES.PLANERAD,
        checklist: [],
        tags: [],
        comments: [],
      });
    }
    setIsDeleteConfirmOpen(false);
    setValidationErrors([]);
  }, [task, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateTaskForm(formData, t);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      validation.errors.forEach(err => showError(err));
      return;
    }

    setValidationErrors([]);
    
    // Prepare data for saving - handle 'Försenad' status (OPTION B: never save 'Försenad')
    const dataToSave = { ...formData };
    
    // If status is 'Försenad' (display status), restore original task.status
    // User can only save Planerad/Pågående/Klar, never 'Försenad'
    if (dataToSave.status === STATUSES.FORSENAD) {
      // Restore original status if user didn't manually change it
      if (dataToSave._originalStatus) {
        dataToSave.status = dataToSave._originalStatus;
      } else {
        // Fallback: if no original status, default to 'Planerad'
        dataToSave.status = STATUSES.PLANERAD;
      }
    }
    
    // Remove internal fields before saving
    delete dataToSave._originalStatus;
    delete dataToSave._displayStatusReason;
    
    // Debug logging (only in development, localhost)
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      logger.logWithPrefix('TaskModal Debug', 'Submitting:', {
        'formData.status (display)': formData.status,
        'dataToSave.status (saved)': dataToSave.status,
        'task.status (original)': task?.status,
        'displayStatusReason': formData._displayStatusReason,
      });
    }
    
    logger.logWithPrefix('TaskModal', 'Submitting formData with comments:', dataToSave.comments);
    try {
      await onSave(dataToSave);
      // Only show success if onSave didn't throw an error
      // Success message is already shown by onSave
      // Modal will be closed by onSave if successful
    } catch (error) {
      // Error is already shown by onSave
      // Don't close modal on error so user can retry
      logger.error('Error in handleSubmit:', error);
      // Don't throw - let user see the error and retry
    }
  };

  const handleDeleteClick = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isDeleteConfirmOpen) {
      setIsDeleteConfirmOpen(true);
      return;
    }
    try {
      await onDelete();
      showSuccess(t('delete') + ' completed');
      onClose();
    } catch (error) {
      showError(t('errorDeleting'));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-800 dark:text-white">
            {task ? t('editTask') : t('newTaskTitle')}
          </h2>
          <button onClick={onClose} aria-label={t('cancel')}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        </div>

        {validationErrors.length > 0 && (
          <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
            <ul className="text-sm text-red-600 dark:text-red-400">
              {validationErrors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto dark:text-gray-200">
          {/* Client & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="col-span-1 sm:col-span-2 md:col-span-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                {t('labelClient')}
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => {
                  const sanitized = validateAndSanitizeInput(e.target.value, 100);
                  setFormData((prev) => ({ ...prev, client: sanitized }));
                }}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder={t('phClient')}
                aria-label={t('labelClient')}
              />
            </div>
            <div className="col-span-1 sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                {t('labelTitle')}
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => {
                  const sanitized = validateAndSanitizeInput(e.target.value, 200);
                  setFormData((prev) => ({ ...prev, title: sanitized }));
                }}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder={t('phTitle')}
                aria-label={t('labelTitle')}
                aria-required="true"
              />
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                {t('labelStatus')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  // When user changes status manually, mark that they've changed it
                  setFormData((prev) => ({ 
                    ...prev, 
                    status: e.target.value,
                    // If user manually changes status to something other than 'Försenad', 
                    // clear _originalStatus so the new value is saved
                    _originalStatus: e.target.value === STATUSES.FORSENAD ? prev._originalStatus : undefined,
                    _displayStatusReason: e.target.value === STATUSES.FORSENAD ? 'dateOverdue' : undefined
                  }));
                }}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none"
                aria-label={t('labelStatus')}
              >
                {/* Always show standard statuses */}
                <option value={STATUSES.PLANERAD}>{t('statusPlan')}</option>
                <option value={STATUSES.PAGENDE}>{t('statusProg')}</option>
                <option value={STATUSES.KLAR}>{t('statusDone')}</option>
                {/* Show 'Försenad' as display-only option when task is overdue */}
                {formData.status === STATUSES.FORSENAD && (
                <option value={STATUSES.FORSENAD}>{t('statusLate')}</option>
                )}
              </select>
              {/* Show info text if status is 'Försenad' due to date */}
              {formData.status === STATUSES.FORSENAD && formData._displayStatusReason === 'dateOverdue' && (
                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Status visas som Försenad eftersom slutdatum har passerat.
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              {t('labelPhase')}
            </label>
            <input
              type="text"
              list="phases"
              value={formData.phase}
              onChange={(e) => {
                const sanitized = validateAndSanitizeInput(e.target.value, 100);
                setFormData((prev) => ({ ...prev, phase: sanitized }));
              }}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder={t('phPhase')}
              aria-label={t('labelPhase')}
            />
            <datalist id="phases">
              <option value={t('phase1')} />
              <option value={t('phase2')} />
              <option value={t('phase3')} />
              <option value={t('phase4')} />
              <option value={t('phase5')} />
              <option value={t('phase6')} />
              <option value={t('phase7')} />
            </datalist>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              {t('labelTags')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags.filter((_, i) => i !== idx),
                      }));
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-red-600"
                    aria-label={t('removeTag')}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => {
                  const sanitized = validateAndSanitizeInput(e.target.value, 50);
                  setNewTag(sanitized);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) {
                    e.preventDefault();
                    const sanitizedTag = validateAndSanitizeInput(newTag.trim(), 50);
                    if (sanitizedTag && !formData.tags.includes(sanitizedTag)) {
                      setFormData((prev) => ({
                        ...prev,
                        tags: [...prev.tags, sanitizedTag],
                      }));
                    }
                    setNewTag('');
                  }
                }}
                className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder={t('phTags')}
                aria-label={t('labelTags')}
              />
              <button
                type="button"
                onClick={() => {
                  const sanitizedTag = validateAndSanitizeInput(newTag.trim(), 50);
                  if (sanitizedTag && !formData.tags.includes(sanitizedTag)) {
                    setFormData((prev) => ({
                      ...prev,
                      tags: [...prev.tags, sanitizedTag],
                    }));
                    setNewTag('');
                  }
                }}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                aria-label={t('addTag')}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('labelDates')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  {t('labelStart')}
                </label>
                <input
                  required
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white"
                  aria-label={t('labelStart')}
                  aria-required="true"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  {t('labelEnd')}
                </label>
                <input
                  required
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm dark:text-white"
                  aria-label={t('labelEnd')}
                  aria-required="true"
                />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <TaskChecklistSection
            checklist={formData.checklist || []}
            onChecklistChange={(updatedChecklist) =>
              setFormData((prev) => ({ ...prev, checklist: updatedChecklist }))
            }
            warningThreshold={warningThreshold}
            t={t}
          />

          {/* Roles */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('labelRoles')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'assignee', label: t('labelRoleUA'), short: 'UA' },
                { key: 'cad', label: t('labelRoleCAD'), short: 'CAD' },
                { key: 'reviewer', label: t('labelRoleG'), short: 'G' },
                { key: 'agent', label: t('labelRoleO'), short: 'O' },
                { key: 'be', label: t('labelRoleBE'), short: 'BE' },
                { key: 'pl', label: t('labelRolePL'), short: 'PL' },
                { key: 'other', label: t('labelRoleOther'), short: t('roleOther') },
              ].map(({ key, label, short }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={formData[key] || ''}
                    onChange={(e) => {
                      const sanitized = validateAndSanitizeInput(e.target.value, 100);
                      setFormData((prev) => ({ ...prev, [key]: sanitized }));
                    }}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-sm"
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <TaskCommentsSection
            comments={formData.comments || []}
            onCommentsChange={(updatedComments) =>
              setFormData((prev) => ({ ...prev, comments: updatedComments }))
            }
            lang={lang}
            t={t}
          />

          <div className="flex justify-between pt-2 items-center">
            {task &&
              (!isDeleteConfirmOpen ? (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
                  aria-label={t('delete')}
                >
                  <Trash2 size={18} />
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded border border-red-100 dark:border-red-800">
                  <span className="text-xs font-bold text-red-600 dark:text-red-300">{t('confirmDelete')}</span>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="text-white bg-red-500 hover:bg-red-600 text-xs px-2 py-1 rounded flex items-center gap-1"
                    aria-label={t('yes')}
                  >
                    <Check size={12} /> {t('yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs px-2 py-1 rounded flex items-center gap-1"
                    aria-label={t('no')}
                  >
                    <XCircle size={12} /> {t('no')}
                  </button>
                </div>
              ))}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                aria-label={t('cancel')}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
                aria-label={t('save')}
              >
                {t('save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

TaskModal.displayName = 'TaskModal';

