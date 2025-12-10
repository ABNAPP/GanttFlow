// Export utility functions
// CSV export for tasks

/**
 * Export tasks to CSV format
 * @param {Array} tasks - Array of task objects
 * @param {Function} t - Translation function
 */
export const exportToCSV = (tasks, t) => {
  if (!tasks || tasks.length === 0) {
    return;
  }

  // CSV Headers
  const headers = [
    t('labelClient') || 'Client',
    t('labelTitle') || 'Title',
    t('labelPhase') || 'Phase',
    t('labelStatus') || 'Status',
    t('statAssignee') || 'UA',
    t('statExecutor') || 'HL',
    t('statCad') || 'CAD',
    t('statReviewer') || 'G',
    t('statAgent') || 'O',
    t('statBe') || 'BE',
    t('statPl') || 'PL',
    t('labelStart') || 'Start Date',
    t('labelEnd') || 'End Date',
    t('labelPriority') || 'Priority',
    t('labelTags') || 'Tags',
  ];

  // CSV Rows
  const rows = tasks.map((task) => {
    return [
      task.client || '',
      task.title || '',
      task.phase || '',
      task.status || '',
    task.assignee || '',
    (task.checklist || []).map(item => item.executor).filter(Boolean).join('; ') || '',
    task.cad || '',
      task.reviewer || '',
      task.agent || '',
      task.be || '',
      task.pl || '',
      task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
      task.endDate ? new Date(task.endDate).toLocaleDateString() : '',
      task.priority || 'normal',
      (task.tags || []).join('; '),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape commas and quotes in cell values
      const cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gantt_tasks_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

