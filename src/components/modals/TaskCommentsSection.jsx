/**
 * TaskCommentsSection - Comments section for TaskModal
 * Extracted from TaskModal.jsx to reduce complexity
 */
import { useState } from 'react';
import { Plus, Check, XCircle, Edit2, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/helpers';
import { showError } from '../../utils/toast';
import { sanitizeText, validateAndSanitizeInput } from '../../utils/sanitize';

export const TaskCommentsSection = ({
  comments,
  onCommentsChange,
  lang,
  t,
}) => {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    // Sanitize and validate comment input
    const sanitizedText = validateAndSanitizeInput(newComment.trim(), 5000);
    if (!sanitizedText) {
      showError(t('errorCommentEmpty') || 'Comment cannot be empty');
      return;
    }
    const comment = {
      id: generateId(),
      text: sanitizedText,
      createdAt: new Date().toISOString(),
      author: 'User', // Could be enhanced with actual user info
    };
    onCommentsChange([...comments, comment]);
    setNewComment('');
  };

  const handleDeleteComment = (commentId) => {
    onCommentsChange(comments.filter((c) => c.id !== commentId));
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
    // Sanitize and validate edited comment
    const sanitizedText = validateAndSanitizeInput(editingCommentText.trim(), 5000);
    if (!sanitizedText) {
      showError(t('errorCommentEmpty') || 'Comment cannot be empty');
      return;
    }
    onCommentsChange(
      comments.map((c) =>
        c.id === editingCommentId ? { ...c, text: sanitizedText } : c
      )
    );
    cancelEditComment();
  };

  return (
    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">
          {t('labelComments')}
        </h3>
        {comments && comments.length > 0 && (
          <span className="text-xs bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comments List */}
      {comments && comments.length > 0 ? (
        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm"
            >
              {editingCommentId === comment.id ? (
                /* Edit Mode */
                <div className="space-y-2">
                  <textarea
                    value={editingCommentText}
                    onChange={(e) => {
                      setEditingCommentText(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        saveEditComment();
                      }
                    }}
                    className="w-full border-2 border-indigo-300 dark:border-indigo-600 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 text-gray-700 dark:text-gray-200"
                    rows="3"
                    aria-label={t('editComment') || 'Redigera kommentar'}
                    maxLength={5000}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {sanitizeText(comment.author || 'User')} •{' '}
                      {new Date(comment.createdAt).toLocaleString(
                        lang === 'sv' ? 'sv-SE' : 'en-US'
                      )}
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
                    <p
                      className="text-sm text-gray-700 dark:text-gray-200"
                      dangerouslySetInnerHTML={{ __html: sanitizeText(comment.text) }}
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {sanitizeText(comment.author || 'User')} •{' '}
                      {new Date(comment.createdAt).toLocaleString(
                        lang === 'sv' ? 'sv-SE' : 'en-US'
                      )}
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
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            {t('noComments')}
          </p>
        </div>
      )}

      {/* Add Comment */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
            }}
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
            maxLength={5000}
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
          {lang === 'sv'
            ? '💡 Tryck Ctrl+Enter för att lägga till snabbt'
            : '💡 Press Ctrl+Enter to add quickly'}
        </p>
      </div>
    </div>
  );
};
