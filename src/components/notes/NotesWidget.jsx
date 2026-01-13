// Notes Widget - Dropdown component for header
import { memo, useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, X, Trash2, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotes } from '../../hooks/useNotes';

export const NotesWidget = memo(({ user, t, isOpen, onClose }) => {
  const { notes, loading, addNote, deleteNote, updateNote } = useNotes(user);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef(null);
  const widgetRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current && !editingId) {
      inputRef.current.focus();
    }
  }, [isOpen, editingId]);

  const handleAdd = () => {
    if (newNoteText.trim()) {
      addNote(newNoteText);
      setNewNoteText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingId) {
        handleSaveEdit();
      } else {
        handleAdd();
      }
    } else if (e.key === 'Escape') {
      if (editingId) {
        setEditingId(null);
        setEditingText('');
      } else {
        onClose();
      }
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setEditingText(note.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim()) {
      updateNote(editingId, editingText);
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  if (!user) return null;

  return (
    <div ref={widgetRef} className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <StickyNote size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('notes')}
                </span>
                {notes.length > 0 && (
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {notes.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label={t('close')}
              >
                <X size={16} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('notesPlaceholder')}
                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  onClick={handleAdd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                  aria-label={t('addNote')}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {loading ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">
                  {t('loading')}
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">
                  {t('notesEmpty')}
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {editingId === note.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="flex-1 border border-indigo-300 dark:border-indigo-600 dark:bg-gray-800 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-gray-900 dark:text-gray-100"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            aria-label={t('save')}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            aria-label={t('cancel')}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-sm text-gray-900 dark:text-gray-100 break-words">
                            {note.text}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(note)}
                              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                              aria-label={t('editNote')}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              aria-label={t('deleteNote')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

NotesWidget.displayName = 'NotesWidget';
