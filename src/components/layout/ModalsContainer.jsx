/**
 * ModalsContainer - Handles all modal rendering
 * Extracted from App.jsx to reduce complexity
 */
import { Suspense, lazy } from 'react';
import { showSuccess } from '../../utils/toast';

// Lazy loaded modals
const TaskModal = lazy(() => import('../modals/TaskModal').then(module => ({ default: module.TaskModal })));
const SettingsModal = lazy(() => import('../modals/SettingsModal').then(module => ({ default: module.SettingsModal })));
const ArchiveModal = lazy(() => import('../modals/ArchiveModal').then(module => ({ default: module.ArchiveModal })));
const TrashModal = lazy(() => import('../modals/TrashModal').then(module => ({ default: module.TrashModal })));
const QuickListModal = lazy(() => import('../modals/QuickListModal').then(module => ({ default: module.QuickListModal })));
const QuickListArchiveModal = lazy(() => import('../modals/QuickListArchiveModal').then(module => ({ default: module.QuickListArchiveModal })));
const QuickListTrashModal = lazy(() => import('../modals/QuickListTrashModal').then(module => ({ default: module.QuickListTrashModal })));

export const ModalsContainer = ({
  // Modal states
  isModalOpen,
  isSettingsOpen,
  isArchiveOpen,
  isTrashOpen,
  isQuickListOpen,
  isQuickListArchiveOpen,
  isQuickListTrashOpen,
  
  // Modal handlers
  onCloseModal,
  onCloseSettings,
  onCloseArchive,
  onCloseTrash,
  onCloseQuickList,
  onCloseQuickListArchive,
  onCloseQuickListTrash,
  
  // Task modal props
  editingTask,
  onSaveTask,
  onDeleteTask,
  warningThreshold,
  
  // Settings modal props
  showChecklistInGantt,
  onWarningThresholdChange,
  onShowChecklistChange,
  cloudBackups,
  loadingBackups,
  onCreateCloudBackup,
  onRestoreCloudBackup,
  onExportData,
  onImportClick,
  
  // Archive modal props
  archivedTasks,
  onRestoreTaskStatus,
  
  // Trash modal props
  deletedTasks,
  onRestoreTask,
  onPermanentDeleteTask,
  confirmDeleteId,
  onSetConfirmDeleteId,
  confirmEmptyTrash,
  onSetConfirmEmptyTrash,
  onEmptyTrash,
  
  // QuickList modal props
  user,
  quickListArchivedItems,
  quickListDeletedItems,
  onRestoreQuickListItem,
  onDeleteQuickListItem,
  onPermanentDeleteQuickListItem,
  onOpenQuickListArchive,
  onOpenQuickListTrash,
  
  t,
}) => {
  return (
    <>
      {/* Task Modal */}
      {isModalOpen && (
        <Suspense fallback={null}>
          <TaskModal
            isOpen={isModalOpen}
            task={editingTask}
            onClose={onCloseModal}
            onSave={onSaveTask}
            onDelete={onDeleteTask}
            warningThreshold={warningThreshold}
            t={t}
            lang="sv"
          />
        </Suspense>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={onCloseSettings}
            warningThreshold={warningThreshold}
            showChecklistInGantt={showChecklistInGantt}
            onWarningThresholdChange={onWarningThresholdChange}
            onShowChecklistChange={onShowChecklistChange}
            cloudBackups={cloudBackups}
            loadingBackups={loadingBackups}
            onCreateCloudBackup={onCreateCloudBackup}
            onRestoreCloudBackup={onRestoreCloudBackup}
            onExportData={onExportData}
            onImportClick={onImportClick}
            t={t}
          />
        </Suspense>
      )}

      {/* Archive Modal */}
      {isArchiveOpen && (
        <Suspense fallback={null}>
          <ArchiveModal
            isOpen={isArchiveOpen}
            onClose={onCloseArchive}
            archivedTasks={archivedTasks}
            onRestore={onRestoreTaskStatus}
            onDelete={onDeleteTask}
            confirmDeleteId={confirmDeleteId}
            onSetConfirmDeleteId={onSetConfirmDeleteId}
            t={t}
          />
        </Suspense>
      )}

      {/* Trash Modal */}
      {isTrashOpen && (
        <Suspense fallback={null}>
          <TrashModal
            isOpen={isTrashOpen}
            onClose={onCloseTrash}
            deletedTasks={deletedTasks}
            onRestore={onRestoreTask}
            onPermanentDelete={onPermanentDeleteTask}
            confirmDeleteId={confirmDeleteId}
            confirmEmptyTrash={confirmEmptyTrash}
            onSetConfirmDeleteId={onSetConfirmDeleteId}
            onSetConfirmEmptyTrash={onSetConfirmEmptyTrash}
            onEmptyTrash={onEmptyTrash}
            t={t}
          />
        </Suspense>
      )}

      {/* QuickList Modal */}
      {isQuickListOpen && (
        <Suspense fallback={null}>
          <QuickListModal
            isOpen={isQuickListOpen}
            onClose={onCloseQuickList}
            user={user}
            t={t}
            onOpenArchive={onOpenQuickListArchive}
            onOpenTrash={onOpenQuickListTrash}
          />
        </Suspense>
      )}

      {/* QuickList Archive Modal */}
      {isQuickListArchiveOpen && (
        <Suspense fallback={null}>
          <QuickListArchiveModal
            isOpen={isQuickListArchiveOpen}
            onClose={onCloseQuickListArchive}
            archivedItems={quickListArchivedItems}
            onRestore={(id) => {
              onRestoreQuickListItem(id);
              showSuccess(t('quickListItemRestored'));
            }}
            onDelete={(id) => {
              onDeleteQuickListItem(id);
              showSuccess(t('quickListItemDeleted'));
            }}
            t={t}
          />
        </Suspense>
      )}

      {/* QuickList Trash Modal */}
      {isQuickListTrashOpen && (
        <Suspense fallback={null}>
          <QuickListTrashModal
            isOpen={isQuickListTrashOpen}
            onClose={onCloseQuickListTrash}
            deletedItems={quickListDeletedItems}
            onRestore={(id) => {
              onRestoreQuickListItem(id);
              showSuccess(t('quickListItemRestored'));
            }}
            onPermanentDelete={(id) => {
              onPermanentDeleteQuickListItem(id);
              showSuccess(t('quickListItemPermanentlyDeleted'));
            }}
            t={t}
          />
        </Suspense>
      )}
    </>
  );
};
