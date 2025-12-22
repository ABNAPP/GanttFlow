import { useState, useEffect } from 'react';
import { memo } from 'react';
import { X, Trash2, Plus, Check, XCircle, RefreshCw, Edit2 } from 'lucide-react';
import { ChecklistItem } from '../common/ChecklistItem';
import { generateId, formatDate, calculateChecklistProgress, validateTaskForm, getTaskDisplayStatus } from '../../utils/helpers';
import { showError, showSuccess } from '../../utils/toast';

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
    status: 'Planerad',
    checklist: [],
    tags: [],
    comments: [],
  });
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newChecklistStartDate, setNewChecklistStartDate] = useState('');
  const [newChecklistEndDate, setNewChecklistEndDate] = useState('');
  const [newChecklistExecutor, setNewChecklistExecutor] = useState('');
  const [newChecklistPriority, setNewChecklistPriority] = useState('normal');
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [tempChecklistData, setTempChecklistData] = useState({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      console.log('[TaskModal] Loading task with comments:', task.comments);
      
      // Get display status (may be 'Försenad' if overdue, but we store original task.status)
      const { status: displayStatus, reason } = getTaskDisplayStatus(task);
      
      // Debug logging (only in development, localhost)
      if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('[TaskModal Debug] Task loaded:', {
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
        _originalStatus: task.status || 'Planerad', // Internal: original task.status
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
        status: 'Planerad',
        checklist: [],
        tags: [],
        comments: [],
      });
    }
    setNewChecklistItem('');
    setNewChecklistStartDate('');
    setNewChecklistEndDate('');
    setNewChecklistExecutor('');
    setNewChecklistPriority('normal');
    setEditingChecklistId(null);
    setNewComment('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setIsDeleteConfirmOpen(false);
    setValidationErrors([]);
  }, [task, isOpen]);

  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: generateId(),
      text: newChecklistItem,
      done: false,
      startDate: newChecklistStartDate || null,
      endDate: newChecklistEndDate || null,
      executor: newChecklistExecutor || null,
      priority: newChecklistPriority || 'normal', // Always include priority field
    };
    setFormData((prev) => ({
      ...prev,
      checklist: [...(prev.checklist || []), newItem],
    }));
    setNewChecklistItem('');
    setNewChecklistStartDate('');
    setNewChecklistEndDate('');
    setNewChecklistExecutor('');
    setNewChecklistPriority('normal');
  };

  const toggleChecklist = (id) => {
    const updated = formData.checklist.map((item) => {
      if (item.id === id) return { ...item, done: !item.done };
      return item;
    });
    setFormData((prev) => ({ ...prev, checklist: updated }));
  };

  const removeChecklist = (id) => {
    const updated = formData.checklist.filter((item) => item.id !== id);
    setFormData((prev) => ({ ...prev, checklist: updated }));
  };

  const startEditingChecklist = (item) => {
    setEditingChecklistId(item.id);
    setTempChecklistData({
      text: item.text,
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      executor: item.executor || '',
      priority: item.priority || 'normal',
    });
  };

  const saveEditingChecklist = () => {
    const updated = formData.checklist.map((item) => {
      if (item.id === editingChecklistId) {
        return {
          ...item,
          text: tempChecklistData.text,
          startDate: tempChecklistData.startDate || null,
          endDate: tempChecklistData.endDate || null,
          executor: tempChecklistData.executor || null,
          priority: tempChecklistData.priority || item.priority || 'normal', // Preserve existing priority if not changed, default to 'normal'
        };
      }
      return item;
    });
    setFormData((prev) => ({ ...prev, checklist: updated }));
    setEditingChecklistId(null);
    setTempChecklistData({});
  };

  const cancelEditingChecklist = () => {
    setEditingChecklistId(null);
    setTempChecklistData({});
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: generateId(),
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
      author: 'User', // Could be enhanced with actual user info
    };
    console.log('[TaskModal] Adding comment:', comment);
    setFormData((prev) => {
      const updated = {
        ...prev,
        comments: [...(prev.comments || []), comment],
      };
      console.log('[TaskModal] Updated formData with comments:', updated.comments);
      return updated;
    });
    setNewComment('');
  };

  const handleDeleteComment = (commentId) => {
    setFormData((prev) => ({
      ...prev,
      comments: (prev.comments || []).filter((c) => c.id !== commentId),
    }));
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text || '');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const saveEditComment = () => {
    if (!editingCommentText.trim()) {
      showError(t('commentEmpty') || 'Kommentaren kan inte vara tom');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      comments: (prev.comments || []).map((c) =>
        c.id === editingCommentId
          ? { ...c, text: editingCommentText.trim() }
          : c
      ),
    }));
    cancelEditComment();
  };

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
    if (dataToSave.status === 'Försenad') {
      // Restore original status if user didn't manually change it
      if (dataToSave._originalStatus) {
        dataToSave.status = dataToSave._originalStatus;
      } else {
        // Fallback: if no original status, default to 'Planerad'
        dataToSave.status = 'Planerad';
      }
    }
    
    // Remove internal fields before saving
    delete dataToSave._originalStatus;
    delete dataToSave._displayStatusReason;
    
    // Debug logging (only in development, localhost)
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('[TaskModal Debug] Submitting:', {
        'formData.status (display)': formData.status,
        'dataToSave.status (saved)': dataToSave.status,
        'task.status (original)': task?.status,
        'displayStatusReason': formData._displayStatusReason,
      });
    }
    
    console.log('[TaskModal] Submitting formData with comments:', dataToSave.comments);
    try {
      await onSave(dataToSave);
      // Only show success if onSave didn't throw an error
      // Success message is already shown by onSave
      // Modal will be closed by onSave if successful
    } catch (error) {
      // Error is already shown by onSave
      // Don't close modal on error so user can retry
      console.error('Error in handleSubmit:', error);
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
                onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                    _originalStatus: e.target.value === 'Försenad' ? prev._originalStatus : undefined,
                    _displayStatusReason: e.target.value === 'Försenad' ? 'dateOverdue' : undefined
                  }));
                }}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none"
                aria-label={t('labelStatus')}
              >
                {/* Always show standard statuses */}
                <option value="Planerad">{t('statusPlan')}</option>
                <option value="Pågående">{t('statusProg')}</option>
                <option value="Klar">{t('statusDone')}</option>
                {/* Show 'Försenad' as display-only option when task is overdue */}
                {formData.status === 'Försenad' && (
                  <option value="Försenad">{t('statusLate')}</option>
                )}
              </select>
              {/* Show info text if status is 'Försenad' due to date */}
              {formData.status === 'Försenad' && formData._displayStatusReason === 'dateOverdue' && (
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
              onChange={(e) => setFormData((prev) => ({ ...prev, phase: e.target.value }))}
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
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) {
                    e.preventDefault();
                    if (!formData.tags.includes(newTag.trim())) {
                      setFormData((prev) => ({
                        ...prev,
                        tags: [...prev.tags, newTag.trim()],
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
                  if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                    setFormData((prev) => ({
                      ...prev,
                      tags: [...prev.tags, newTag.trim()],
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
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex justify-between">
              {t('labelChecklist')}{' '}
              <span className="text-indigo-500">{calculateChecklistProgress(formData.checklist)}%</span>
            </h3>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full mb-4">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${calculateChecklistProgress(formData.checklist)}%` }}
                role="progressbar"
                aria-valuenow={calculateChecklistProgress(formData.checklist)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="space-y-2 mb-3">
              {formData.checklist?.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 py-1 border-b border-gray-100 dark:border-gray-600/30 last:border-0"
                >
                  <ChecklistItem
                    item={item}
                    isEditing={editingChecklistId === item.id}
                    tempData={tempChecklistData}
                    warningThreshold={warningThreshold}
                    onToggle={() => toggleChecklist(item.id)}
                    onEdit={() => startEditingChecklist(item)}
                    onSaveEdit={saveEditingChecklist}
                    onCancelEdit={cancelEditingChecklist}
                    onDelete={() => removeChecklist(item.id)}
                    onTextChange={(text) => setTempChecklistData((prev) => ({ ...prev, text }))}
                    onStartDateChange={(date) => setTempChecklistData((prev) => ({ ...prev, startDate: date }))}
                    onEndDateChange={(date) => setTempChecklistData((prev) => ({ ...prev, endDate: date }))}
                    onExecutorChange={(executor) => setTempChecklistData((prev) => ({ ...prev, executor }))}
                    onPriorityChange={(priority) => setTempChecklistData((prev) => ({ ...prev, priority }))}
                    t={t}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklist();
                    }
                  }}
                  placeholder={t('phChecklist')}
                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                  aria-label={t('phChecklist')}
                />
                <button
                  type="button"
                  onClick={handleAddChecklist}
                  className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors"
                  aria-label={t('addChecklistItem')}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex gap-2 items-center text-xs flex-wrap">
                <label className="text-gray-500 dark:text-gray-400">{t('checklistStart')}:</label>
                <input
                  type="date"
                  value={newChecklistStartDate}
                  onChange={(e) => setNewChecklistStartDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 outline-none text-gray-600 dark:text-gray-300"
                  aria-label={t('checklistStart')}
                />
                <label className="text-gray-500 dark:text-gray-400 ml-2">{t('checklistEnd')}:</label>
                <input
                  type="date"
                  value={newChecklistEndDate}
                  onChange={(e) => setNewChecklistEndDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 outline-none text-gray-600 dark:text-gray-300"
                  aria-label={t('checklistEnd')}
                />
                <label className="text-gray-500 dark:text-gray-400 ml-2 font-semibold text-indigo-600 dark:text-indigo-400">{t('statExecutor')}:</label>
                <input
                  type="text"
                  value={newChecklistExecutor}
                  onChange={(e) => setNewChecklistExecutor(e.target.value)}
                  placeholder={t('hlPlaceholder')}
                  className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/40 rounded px-2 py-1 outline-none text-gray-700 dark:text-gray-300 text-xs"
                  aria-label={t('statExecutor')}
                />
                <label className="text-gray-500 dark:text-gray-400 ml-2">{t('labelPriority')}:</label>
                <select
                  value={newChecklistPriority}
                  onChange={(e) => setNewChecklistPriority(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 outline-none text-gray-600 dark:text-gray-300 text-xs"
                  aria-label={t('labelPriority')}
                >
                  <option value="low">{t('priorityLow')}</option>
                  <option value="normal">{t('priorityNormal')}</option>
                  <option value="high">{t('priorityHigh')}</option>
                </select>
              </div>
            </div>
          </div>

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
                    onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded px-2 py-1 text-sm"
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section - Always visible */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">{t('labelComments')}</h3>
              {formData.comments && formData.comments.length > 0 && (
                <span className="text-xs bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  {formData.comments.length}
                </span>
              )}
            </div>
            
            {/* Comments List */}
            {formData.comments && formData.comments.length > 0 ? (
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {formData.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm"
                  >
                    {editingCommentId === comment.id ? (
                      /* Edit Mode */
                      <div className="space-y-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              saveEditComment();
                            }
                          }}
                          className="w-full border-2 border-indigo-300 dark:border-indigo-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-gray-700 dark:text-gray-200"
                          rows="3"
                          aria-label={t('editComment') || 'Redigera kommentar'}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {comment.author} • {new Date(comment.createdAt).toLocaleString(lang === 'sv' ? 'sv-SE' : 'en-US')}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveEditComment}
                              className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              aria-label={t('saveEdit') || 'Spara ändring'}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditComment}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              aria-label={t('cancelEdit') || 'Avbryt redigering'}
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-200">{comment.text}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {comment.author} • {new Date(comment.createdAt).toLocaleString(lang === 'sv' ? 'sv-SE' : 'en-US')}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditComment(comment)}
                            className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                            aria-label={t('editComment') || 'Redigera kommentar'}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={t('deleteComment')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center">{t('noComments')}</p>
              </div>
            )}

            {/* Add Comment - Always visible */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  placeholder={t('commentPlaceholder')}
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                  rows="2"
                  aria-label={t('commentPlaceholder')}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 flex-shrink-0 transition-colors"
                  aria-label={t('addComment')}
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {lang === 'sv' ? '💡 Tryck Ctrl+Enter för att lägga till snabbt' : '💡 Press Ctrl+Enter to add quickly'}
              </p>
            </div>
          </div>

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

