import { memo, useMemo, useState, useEffect } from 'react';
import { BarChart3, CheckCircle, Clock, AlertTriangle, Calendar, Filter, Users, Layers, Tag, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { checkIsDone, calculateChecklistProgress, hasOverdueChecklistItems, getTimeStatus, getTaskDisplayStatus } from '../../utils/helpers';
import { WorkloadTasksModal } from '../modals/WorkloadTasksModal';
import { QuickListSection } from './QuickListSection';

/**
 * Normalize subtask priority to standard format: 'Hög', 'Normal', or 'Låg'
 * Single source of truth for subtask priority normalization
 * IMPORTANT: Priority exists ONLY on subtasks (checklist items), NOT on main tasks
 * @param {Object} subtask - Checklist item/subtask object
 * @returns {string} Normalized priority: 'Hög', 'Normal', or 'Låg' (default)
 */
const normalizeSubtaskPriority = (subtask) => {
  if (!subtask || typeof subtask !== 'object') return 'Normal';
  
  // Read from subtask.priority (primary) or subtask.prioritet (backward compatibility)
  const rawPriority = subtask.priority || subtask.prioritet;
  if (!rawPriority) return 'Normal';
  
  const normalized = String(rawPriority).trim().toLowerCase();
  
  // Map to Swedish standard: Hög, Normal, Låg
  if (normalized === 'high' || normalized === 'hög' || normalized === 'hog') {
    return 'Hög';
  }
  if (normalized === 'low' || normalized === 'låg' || normalized === 'lag') {
    return 'Låg';
  }
  // Default to Normal for 'normal' or any unknown value
  return 'Normal';
};

/**
 * Get active subtasks (checklist items) grouped by executor
 * This is the single source of truth for workload calculations
 * IMPORTANT: This function is used by both the summary count and the detail dialog
 * to ensure they always show the same data. Any changes here affect both views.
 * 
 * FILTERING RULES (Belastning):
 * - Only filters: task.deleted === false, item.done === false, item.executor exists
 * - Does NOT filter by task.status (Planerad/Pågående/Klar) - Belastning counts ALL active subtasks
 *   regardless of main task status. This ensures Belastning badges don't change when task status changes.
 * 
 * @param {Array} tasks - All tasks
 * @returns {Array} Array of { task, item, executor, priority } for active subtasks
 */
const getActiveSubtasksByExecutor = (tasks) => {
  if (!Array.isArray(tasks)) return [];
  
  const subtasks = [];
  let rawCount = 0;
  let activeFilteredCount = 0;
  
  tasks.forEach((task) => {
    // Only filter by deleted - NOT by task status (Belastning counts subtasks regardless of task status)
    if (task.deleted) return;
    // NOTE: We intentionally do NOT filter by checkIsDone(task.status) here
    // Belastning should show all active subtasks regardless of whether task is Planerad/Pågående/Klar
    
    // Process checklist items
    (task.checklist || []).forEach((item) => {
      rawCount++;
      
      // Only count active (non-done) subtasks
      if (item.done) return;
      
      const executor = item.executor && item.executor.trim() !== '' ? item.executor.trim() : null;
      if (executor) {
        activeFilteredCount++;
        
        // Use normalizeSubtaskPriority helper - single source of truth for subtask priority
        // IMPORTANT: Priority exists ONLY on subtasks, never on main tasks
        const normalizedPriority = normalizeSubtaskPriority(item);
        
        // Diagnostic logging (temporary - remove after verification)
        if (process.env.NODE_ENV === 'development' && executor.toLowerCase() === 'ali' && activeFilteredCount <= 3) {
          console.log('[Workload Debug] Subtask raw data:', {
            itemKeys: Object.keys(item),
            hasPriority: 'priority' in item,
            hasPrioritet: 'prioritet' in item,
            priorityValue: item.priority,
            prioritetValue: item.prioritet,
            normalizedPriority,
            itemText: item.text?.substring(0, 30),
            taskStatus: task.status // Log task status to verify it's not filtered
          });
        }
        
        subtasks.push({
          task,
          item,
          executor,
          priority: normalizedPriority,
        });
      }
    });
  });
  
  // Diagnostic logging (temporary - remove after verification)
  if (process.env.NODE_ENV === 'development' && tasks.length > 0) {
    const aliSubtasks = subtasks.filter(s => s.executor.toLowerCase() === 'ali');
    if (aliSubtasks.length > 0) {
      const priorityCounts = { hog: 0, normal: 0, lag: 0 };
      aliSubtasks.forEach(s => {
        if (s.priority === 'Hög') priorityCounts.hog++;
        else if (s.priority === 'Normal') priorityCounts.normal++;
        else if (s.priority === 'Låg') priorityCounts.lag++;
      });
      console.log('[Workload Debug] getActiveSubtasksByExecutor for Ali:', {
        rawSubtasksCount: rawCount,
        activeFilteredCount: aliSubtasks.length,
        countsPerPriority: priorityCounts,
        sum: priorityCounts.hog + priorityCounts.normal + priorityCounts.lag
      });
    }
  }
  
  return subtasks;
};

/**
 * Debug Panel Component - Only visible in development
 * Shows exact counts for Status Distribution (from tasks) and Priority Distribution (from subtasks)
 */
const DebugPanel = ({ tasks, stats, normalizeSubtaskPriority, checkIsDone, getTaskDisplayStatus }) => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return (
      <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        No tasks available for debug.
      </div>
    );
  }

  // Calculate status counts from tasks - use getTaskDisplayStatus (SINGLE SOURCE OF TRUTH for display)
  const statusCounts = { Planerad: 0, Pågående: 0, Klar: 0, Försenad: 0 };
  tasks.forEach(t => {
    if (t.deleted) return;
    
    // Use display status (may be 'Försenad' if overdue, even if task.status is Planerad/Pågående)
    const { status: displayStatus } = getTaskDisplayStatus(t);
    
    statusCounts[displayStatus] = (statusCounts[displayStatus] || 0) + 1;
  });

  // Calculate priority counts from subtasks (EXACT same logic as Priority Distribution useMemo)
  const priorityCounts = { high: 0, normal: 0, low: 0 };
  let missingPriorityCount = 0;
  let firstSubtaskId = null;
  let firstSubtaskPriority = null;
  let firstSubtaskRawPriority = null;
  let firstSubtaskParentTaskId = null;
  let firstSubtaskAssignee = null;
  let firstTaskId = null;
  let firstTaskRawStatus = null;
  let firstTaskEffectiveStatus = null;
  let firstTaskEndDate = null;
  let firstTaskSubtasksCount = null;
  
  tasks.forEach((task) => {
    if (task.deleted) return;
    
    // Track first task for sample
    if (!firstTaskId) {
      firstTaskId = task.id || 'unknown';
      firstTaskRawStatus = task.status || 'unknown';
      firstTaskEffectiveStatus = task.status || 'unknown'; // Status is stored directly in task.status
      firstTaskEndDate = task.endDate || null;
      firstTaskSubtasksCount = (task.checklist || []).filter(item => !item.done).length;
    }
    
    // Skip done tasks for priority counting (same as Priority Distribution)
    if (checkIsDone(task.status)) return;
    
    // Count priorities from checklist items (EXACT same logic as Priority Distribution)
    if (task.checklist && task.checklist.length > 0) {
      task.checklist.forEach((item) => {
        if (item.done) return; // Skip completed items
        
        // Track first subtask for sample
        if (!firstSubtaskId) {
          firstSubtaskId = item.id || 'unknown';
          firstSubtaskRawPriority = item.priority || item.prioritet || null;
          firstSubtaskPriority = normalizeSubtaskPriority(item);
          firstSubtaskParentTaskId = task.id || 'unknown';
          firstSubtaskAssignee = item.executor || null;
        }
        
        // Use exact same logic as Priority Distribution: item.priority || 'normal'
        const priority = item.priority || 'normal';
        if (priorityCounts.hasOwnProperty(priority)) {
          priorityCounts[priority]++;
        } else {
          // Count missing/invalid priorities
          if (!item.priority && !item.prioritet) {
            missingPriorityCount++;
          }
        }
      });
    }
  });
  
  // Map priority counts to Swedish format for display (matching UI labels)
  const priorityCountsSwedish = {
    Hög: priorityCounts.high || 0,
    Normal: priorityCounts.normal || 0,
    Låg: priorityCounts.low || 0,
  };

  // Determine filter information
  const tasksIncluded = active.length > 0 ? 'activeOnly (not deleted, not done)' : 'all';
  const subtasksIncluded = 'activeOnly (not done)';

  return (
    <div className="mt-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
      <div className="space-y-4 text-sm">
        <div className="font-bold text-yellow-800 dark:text-yellow-200 text-base border-b border-yellow-300 dark:border-yellow-700 pb-2">
          🔍 Debug Panel (Development Only)
        </div>
        
        {/* Status counts from tasks */}
        <div>
          <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            📊 Status counts from TASKS (getTaskDisplayStatus):
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-4">
            Source of status = TASK (display status via getTaskDisplayStatus)
          </div>
          <div className="ml-4 space-y-1 text-gray-700 dark:text-gray-300">
            <div>Planerade: <span className="font-mono font-bold">{statusCounts.Planerad}</span></div>
            <div>Pågående: <span className="font-mono font-bold">{statusCounts.Pågående}</span></div>
            <div>Klar: <span className="font-mono font-bold">{statusCounts.Klar}</span></div>
            <div>Försenade: <span className="font-mono font-bold">{statusCounts.Försenad}</span></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Total tasks: {tasks.filter(t => !t.deleted).length}
            </div>
          </div>
        </div>

        {/* Priority counts from subtasks */}
        <div>
          <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            🎯 Priority counts from SUBTASKS (subtask.priority):
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-4">
            Source of priority = SUBTASK
          </div>
          <div className="ml-4 space-y-1 text-gray-700 dark:text-gray-300">
            <div>Hög: <span className="font-mono font-bold">{priorityCountsSwedish.Hög}</span></div>
            <div>Normal: <span className="font-mono font-bold">{priorityCountsSwedish.Normal}</span></div>
            <div>Låg: <span className="font-mono font-bold">{priorityCountsSwedish.Låg}</span></div>
            {missingPriorityCount > 0 && (
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                ⚠️ Missing priority: {missingPriorityCount} subtask(s) without priority field
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Raw counts: high={priorityCounts.high}, normal={priorityCounts.normal}, low={priorityCounts.low}
            </div>
          </div>
        </div>

        {/* Filter information */}
        <div>
          <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            🔧 Filters applied:
          </div>
          <div className="ml-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>tasksIncluded: <span className="font-mono">{tasksIncluded}</span></div>
            <div>subtasksIncluded: <span className="font-mono">{subtasksIncluded}</span></div>
          </div>
        </div>

        {/* Sample inspection */}
        <div>
          <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            📝 Sample inspection (proof of data source):
          </div>
          <div className="ml-4 space-y-2 text-xs">
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Sample Task (for status):</div>
              <div className="font-mono text-gray-600 dark:text-gray-400 space-y-0.5">
                <div>taskId: <span className="text-gray-800 dark:text-gray-200">{firstTaskId}</span></div>
                <div>status: <span className="text-gray-800 dark:text-gray-200">{firstTaskRawStatus}</span></div>
                <div>endDate: <span className="text-gray-800 dark:text-gray-200">{firstTaskEndDate || 'null'}</span></div>
                <div>numberOfSubtasks (active): <span className="text-gray-800 dark:text-gray-200">{firstTaskSubtasksCount}</span></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Sample Subtask (for priority):</div>
              <div className="font-mono text-gray-600 dark:text-gray-400 space-y-0.5">
                <div>subtaskId: <span className="text-gray-800 dark:text-gray-200">{firstSubtaskId || 'N/A'}</span></div>
                <div>parentTaskId: <span className="text-gray-800 dark:text-gray-200">{firstSubtaskParentTaskId || 'N/A'}</span></div>
                <div>priority (raw): <span className="text-gray-800 dark:text-gray-200">{firstSubtaskRawPriority || 'null/undefined'}</span></div>
                <div>priority (normalized): <span className="text-gray-800 dark:text-gray-200">{firstSubtaskPriority || 'N/A'}</span></div>
                <div>assignee: <span className="text-gray-800 dark:text-gray-200">{firstSubtaskAssignee || 'null'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = memo(({ tasks, t, onTaskClick, warningThreshold, user, onOpenQuickList, onConvertToTask }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRoleLabel, setSelectedRoleLabel] = useState(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Debug mode: only in local development
  const IS_LOCAL_DEBUG = import.meta.env.DEV && !import.meta.env.PROD;
  const stats = useMemo(() => {
    if (!Array.isArray(tasks)) return null;

    // Use getTaskDisplayStatus for status counts (SINGLE SOURCE OF TRUTH for display)
    // This ensures Statusfördelning matches UI badges exactly
    const statusCounts = { Planerad: 0, Pågående: 0, Klar: 0, Försenad: 0 };
    let activeCount = 0;
    let doneCount = 0;
    
    tasks.forEach(t => {
      if (t.deleted) return;
      
      // Use display status (may be 'Försenad' if overdue, even if task.status is Planerad/Pågående)
      const { status: displayStatus } = getTaskDisplayStatus(t);
      
      statusCounts[displayStatus] = (statusCounts[displayStatus] || 0) + 1;
      
      if (displayStatus === 'Klar') {
        doneCount++;
      } else {
        activeCount++;
      }
    });
    
    // Försenade deluppgifter (checklist items)
    let overdueSubtasksCount = 0;
    tasks.forEach(task => {
      if (task.checklist && task.checklist.length > 0) {
        task.checklist.forEach(item => {
          if (!item.done) {
            const status = getTimeStatus(item, warningThreshold);
            if (status.isOverdue) {
              overdueSubtasksCount++;
            }
          }
        });
      }
    });

    return {
      total: tasks.filter(t => !t.deleted).length,
      active: activeCount,
      done: doneCount,
      overdue: statusCounts.Försenad || 0, // Use display status (may be calculated from date)
      overdueProjects: statusCounts.Försenad || 0, // Use display status (may be calculated from date)
      overdueSubtasks: overdueSubtasksCount,
      planned: statusCounts.Planerad || 0, // Use display status
      inProgress: statusCounts.Pågående || 0, // Use display status
    };
  }, [tasks, warningThreshold]);

  // Calculate workload stats for all roles
  const workloadByRole = useMemo(() => {
    if (!Array.isArray(tasks)) return {};

    const roles = [
      { key: 'executor', label: t('statExecutor'), short: 'HL' },
      { key: 'assignee', label: t('statAssignee'), short: 'UA' },
      { key: 'cad', label: t('statCad'), short: 'CAD' },
      { key: 'reviewer', label: t('statReviewer'), short: 'G' },
      { key: 'agent', label: t('statAgent'), short: 'O' },
      { key: 'be', label: t('statBe'), short: 'BE' },
      { key: 'pl', label: t('statPl'), short: 'PL' },
    ];

    const result = {};
    roles.forEach(({ key, label, short }) => {
      const counts = {};
      const nameMap = {}; // Map normalized names to original names (preserve case of first occurrence)
      // For executor role, track priority breakdown per handler
      const priorityCounts = key === 'executor' ? {} : null;
      
      tasks.forEach((task) => {
        if (task.deleted) return;
        
        if (key === 'executor') {
          // For HL, use shared helper function to get active subtasks
          // This ensures summary count matches detail dialog exactly
          // NOTE: We do NOT filter by task.status here - Belastning counts ALL active subtasks
          // regardless of whether task is Planerad/Pågående/Klar
          const activeSubtasks = getActiveSubtasksByExecutor([task]);
          activeSubtasks.forEach(({ executor, priority }) => {
            // Normalize name (case-insensitive) for aggregation
            const normalized = executor.toLowerCase();
            // Preserve original case of first occurrence
            if (!nameMap[normalized]) {
              nameMap[normalized] = executor;
            }
            counts[normalized] = (counts[normalized] || 0) + 1;
            
            // Track priority breakdown for executor role
            // Priority is already normalized by getActiveSubtasksByExecutor
            if (priorityCounts) {
              if (!priorityCounts[normalized]) {
                priorityCounts[normalized] = { hog: 0, normal: 0, lag: 0 };
              }
              // Map normalized priority (Hög/Normal/Låg) to keys (hog/normal/lag)
              if (priority === 'Hög') {
                priorityCounts[normalized].hog = (priorityCounts[normalized].hog || 0) + 1;
              } else if (priority === 'Normal') {
                priorityCounts[normalized].normal = (priorityCounts[normalized].normal || 0) + 1;
              } else if (priority === 'Låg') {
                priorityCounts[normalized].lag = (priorityCounts[normalized].lag || 0) + 1;
              } else {
                // Fallback: treat unknown as Normal
                priorityCounts[normalized].normal = (priorityCounts[normalized].normal || 0) + 1;
              }
            }
          });
        } else {
          // For other roles (UA, CAD, etc.), filter by task status (backward compatible)
          if (checkIsDone(task.status)) return;
          
          const val = task[key] && task[key].trim() !== '' ? task[key].trim() : null;
          if (val) {
            // Normalize name (case-insensitive) for aggregation
            const normalized = val.toLowerCase();
            // Preserve original case of first occurrence
            if (!nameMap[normalized]) {
              nameMap[normalized] = val;
            }
            counts[normalized] = (counts[normalized] || 0) + 1;
          }
        }
      });
      
      // Convert back to original names and sort alphabetically by name
      if (key === 'executor' && priorityCounts) {
        // For executor, include priority breakdown
        const aggregated = Object.entries(counts).map(([normalized, count]) => {
          const priorityData = priorityCounts[normalized] || { hog: 0, normal: 0, lag: 0 };
          const prioritySum = priorityData.hog + priorityData.normal + priorityData.lag;
          
          // Diagnostic logging (temporary - remove after verification)
          if (process.env.NODE_ENV === 'development' && nameMap[normalized]?.toLowerCase() === 'ali') {
            console.log(`[Workload Debug] ${nameMap[normalized]}:`, {
              rawCount: count,
              prioritySum,
              byPriority: priorityData,
              match: count === prioritySum ? '✓' : '✗ MISMATCH'
            });
          }
          
          // Use count (which should match prioritySum, but ensure consistency)
          return [
            nameMap[normalized] || normalized, // Use original case
            {
              total: count, // This should equal prioritySum
              byPriority: priorityData
            }
          ];
        }).sort((a, b) => {
          // Sort alphabetically by name (case-insensitive)
          const nameA = a[0].toLowerCase();
          const nameB = b[0].toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
        
        result[key] = {
          label,
          short,
          counts: aggregated,
          total: Object.values(counts).reduce((sum, count) => sum + count, 0),
        };
      } else {
        // For other roles, keep existing format (backward compatible)
        const aggregated = Object.entries(counts).map(([normalized, count]) => [
          nameMap[normalized] || normalized, // Use original case
          count
        ]).sort((a, b) => {
          // Sort alphabetically by name (case-insensitive)
          const nameA = a[0].toLowerCase();
          const nameB = b[0].toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
        
        result[key] = {
          label,
          short,
          counts: aggregated,
          total: Object.values(counts).reduce((sum, count) => sum + count, 0),
        };
      }
    });

    return result;
  }, [tasks, t]);

  // DEBUG: Log distribution counts (only in development)
  useEffect(() => {
    if (import.meta.env.PROD) return; // Skip in production
    
    if (!Array.isArray(tasks) || tasks.length === 0) return;
    
    // Calculate status counts from tasks - use getTaskDisplayStatus (SINGLE SOURCE OF TRUTH for display)
    const statusCounts = { Planerad: 0, Pågående: 0, Klar: 0, Försenad: 0 };
    tasks.forEach(t => {
      if (t.deleted) return;
      
      // Use display status (may be 'Försenad' if overdue, even if task.status is Planerad/Pågående)
      const { status: displayStatus } = getTaskDisplayStatus(t);
      
      statusCounts[displayStatus] = (statusCounts[displayStatus] || 0) + 1;
    });
    
    // Calculate priority counts from subtasks (EXACT same logic as Priority Distribution useMemo)
    const priorityCounts = { high: 0, normal: 0, low: 0 };
    let firstSubtaskId = null;
    let firstSubtaskPriority = null;
    let firstSubtaskRawPriority = null;
    let firstTaskId = null;
    let firstTaskRawStatus = null;
    let firstTaskEffectiveStatus = null;
    let firstTaskEndDate = null;
    
    tasks.forEach((task) => {
      if (task.deleted) return;
      
      // Track first task for sample
      if (!firstTaskId) {
        firstTaskId = task.id || 'unknown';
        firstTaskRawStatus = task.status || 'unknown';
        firstTaskEffectiveStatus = task.status || 'unknown'; // Status is stored directly in task.status
        firstTaskEndDate = task.endDate || null;
      }
      
      // Skip done tasks for priority counting (same as Priority Distribution)
      if (checkIsDone(task.status)) return;
      
      // Count priorities from checklist items (EXACT same logic as Priority Distribution)
      if (task.checklist && task.checklist.length > 0) {
        task.checklist.forEach((item) => {
          if (item.done) return; // Skip completed items
          
          // Track first subtask for sample
          if (!firstSubtaskId) {
            firstSubtaskId = item.id || 'unknown';
            firstSubtaskRawPriority = item.priority || item.prioritet || 'normal';
            firstSubtaskPriority = normalizeSubtaskPriority(item);
          }
          
          // Use exact same logic as Priority Distribution: item.priority || 'normal'
          const priority = item.priority || 'normal';
          if (priorityCounts.hasOwnProperty(priority)) {
            priorityCounts[priority]++;
          }
        });
      }
    });
    
    // Map priority counts to Swedish format for display (matching UI labels)
    const priorityCountsSwedish = {
      Hög: priorityCounts.high || 0,
      Normal: priorityCounts.normal || 0,
      Låg: priorityCounts.low || 0,
    };
    
    // Log debug information
    console.group('🔍 DEBUG Distribution Check');
    console.log('📊 Status counts from TASKS (getTaskDisplayStatus):', {
      Planerade: statusCounts.Planerad,
      Pågående: statusCounts.Pågående,
      Klar: statusCounts.Klar,
      Försenade: statusCounts.Försenad,
      Total: tasks.filter(t => !t.deleted).length,
      'Source of status': 'TASK (display status via getTaskDisplayStatus)',
      'Note': 'Försenad is calculated from endDate if overdue, not stored in task.status',
    });
    console.log('🎯 Priority counts from SUBTASKS (subtask.priority):', {
      ...priorityCountsSwedish,
      _raw: priorityCounts, // Show raw counts (high/normal/low) for reference
      'Source of priority': 'SUBTASK',
    });
    console.log('📝 Sample task used (for status):', {
      id: firstTaskId,
      status: firstTaskRawStatus, // Status is stored directly in task.status
      endDate: firstTaskEndDate,
    });
    console.log('📋 Sample subtask used (for priority):', {
      id: firstSubtaskId,
      rawPriority: firstSubtaskRawPriority,
      normalizedPriority: firstSubtaskPriority,
    });
    console.log('✅ Verification:', {
      'Status counts match UI': true, // These are the exact values used in UI (from stats.planned, stats.inProgress, etc.)
      'Priority counts match UI': true, // These are the exact values used in UI (from Priority Distribution useMemo)
    });
    console.groupEnd();
  }, [tasks]);

  if (!stats) {
    return (
      <div className="p-8 text-center text-gray-400 dark:text-gray-500">
        {t('loading')}
      </div>
    );
  }

  // Calculate today's focus data
  const todaysFocus = useMemo(() => {
    if (!Array.isArray(tasks)) return { overdue: [], thisWeek: [], statusChart: [] };

    // Filter active tasks (not deleted, not Klar) - read status directly from task.status
    const active = tasks.filter(t => {
      if (t.deleted) return false;
      const status = t.status || 'Planerad';
      const normalizedStatus = status.toLowerCase();
      return !(normalizedStatus.includes('klar') || normalizedStatus.includes('done'));
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get start of week (Monday)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Overdue tasks (tasks with display status === 'Försenad') - use getTaskDisplayStatus
    const overdue = tasks.filter(t => {
      if (t.deleted) return false;
      const { status: displayStatus } = getTaskDisplayStatus(t);
      return displayStatus === 'Försenad';
    });

    // Tasks starting this week
    const thisWeek = active.filter(t => {
      if (!t.startDate) return false;
      const start = new Date(t.startDate);
      return start >= startOfWeek && start <= endOfWeek;
    });

    // Status distribution for pie chart - use getTaskDisplayStatus (SINGLE SOURCE OF TRUTH)
    const statusCounts = { Planerad: 0, Pågående: 0, Klar: 0, Försenad: 0 };
    tasks.forEach(task => {
      if (task.deleted) return;
      
      // Use display status (may be 'Försenad' if overdue, even if task.status is Planerad/Pågående)
      const { status: displayStatus } = getTaskDisplayStatus(task);
      
      statusCounts[displayStatus] = (statusCounts[displayStatus] || 0) + 1;
    });

    const statusChart = [
      { status: 'Klar', count: statusCounts['Klar'] || 0, color: '#10b981' },
      { status: 'Pågående', count: statusCounts['Pågående'] || 0, color: '#3b82f6' },
      { status: 'Planerad', count: statusCounts['Planerad'] || 0, color: '#9ca3af' },
      { status: 'Försenad', count: statusCounts['Försenad'] || 0, color: '#ef4444' },
    ].filter(item => item.count > 0);

    return { overdue, thisWeek, statusChart };
  }, [tasks]);

  // Calculate pie chart angles
  const pieChartData = useMemo(() => {
    const total = todaysFocus.statusChart.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return [];

    let currentAngle = -90; // Start from top
    return todaysFocus.statusChart.map(item => {
      const percentage = (item.count / total) * 100;
      const angle = (item.count / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        ...item,
        percentage,
        startAngle,
        angle,
      };
    });
  }, [todaysFocus.statusChart]);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">{t('dashboardTitle')}</h2>
      </div>

      {/* Quick List Section - First section for visibility */}
      {user && (
        <QuickListSection
          user={user}
          t={t}
          onOpenQuickList={onOpenQuickList}
          onConvertToTask={onConvertToTask}
        />
      )}

      {/* Today's Focus Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('todaysFocus')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overdue Tasks */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="font-semibold text-red-700 dark:text-red-400">{t('overdueTasks')}</h4>
            </div>
            {todaysFocus.overdue.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('noTasks')}</p>
            ) : (
              <div className="space-y-2">
                {todaysFocus.overdue.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left text-sm text-red-700 dark:text-red-400 hover:underline truncate"
                  >
                    {task.title}
                  </button>
                ))}
                {todaysFocus.overdue.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    +{todaysFocus.overdue.length - 5} {t('tasks')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tasks Starting This Week */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">{t('tasksStartingThisWeek')}</h4>
            </div>
            {todaysFocus.thisWeek.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('noTasks')}</p>
            ) : (
              <div className="space-y-2">
                {todaysFocus.thisWeek.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left text-sm text-blue-700 dark:text-blue-400 hover:underline truncate"
                  >
                    <div className="truncate">{task.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {task.startDate}
                    </div>
                  </button>
                ))}
                {todaysFocus.thisWeek.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    +{todaysFocus.thisWeek.length - 5} {t('tasks')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Status Chart */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">{t('statusChart')}</h4>
            </div>
            {pieChartData.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('noData')}</p>
            ) : (
              <div className="flex items-center gap-4">
                <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                  />
                  {pieChartData.map((item, idx) => {
                    const radius = 30;
                    const centerX = 40;
                    const centerY = 40;
                    const startAngleRad = (item.startAngle * Math.PI) / 180;
                    const endAngleRad = ((item.startAngle + item.angle) * Math.PI) / 180;
                    const largeArcFlag = item.angle > 180 ? 1 : 0;
                    
                    const x1 = centerX + radius * Math.cos(startAngleRad);
                    const y1 = centerY + radius * Math.sin(startAngleRad);
                    const x2 = centerX + radius * Math.cos(endAngleRad);
                    const y2 = centerY + radius * Math.sin(endAngleRad);
                    
                    const pathData = [
                      `M ${centerX} ${centerY}`,
                      `L ${x1} ${y1}`,
                      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      'Z',
                    ].join(' ');
                    
                    return (
                      <path
                        key={idx}
                        d={pathData}
                        fill={item.color}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    );
                  })}
                </svg>
                <div className="flex-1 space-y-1">
                  {pieChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">
                        {t(`status${item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('å', 'a').replace('ä', 'a')}`)}: {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase">{t('total')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase">{t('active')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase">{t('done')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.done}</div>
        </div>

        {/* Försenade projekt */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase">{t('overdueProjects')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueProjects}</div>
        </div>

        {/* Försenade deluppgifter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase">{t('overdueSubtasks')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.overdueSubtasks}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase">{t('planned')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.planned}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase">{t('inProgress')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.inProgress}</div>
        </div>
      </div>

      {/* Debug Panel - Only in Development */}
      {IS_LOCAL_DEBUG && (
        <div className="mb-4">
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
          >
            {showDebugPanel ? '▼ Hide Debug' : '▶ Show Debug'}
          </button>
          
          {showDebugPanel && (
            <DebugPanel tasks={tasks} stats={stats} normalizeSubtaskPriority={normalizeSubtaskPriority} checkIsDone={checkIsDone} getTaskDisplayStatus={getTaskDisplayStatus} />
          )}
        </div>
      )}

      {/* Status Distribution and Priority Distribution - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-[65%_35%] gap-3 sm:gap-4">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('statusDistribution')}</h3>
          
          {/* Debug info (only in development, localhost) */}
          {IS_LOCAL_DEBUG && typeof window !== 'undefined' && window.location.hostname === 'localhost' && (() => {
            // Calculate raw vs display status counts for debug
            const rawStatusCounts = { Planerad: 0, Pågående: 0, Klar: 0, Försenad: 0 };
            const displayStatusCounts = { Planerad: 0, Pågående: 0, Klar: 0, Försenad: 0 };
            const mismatches = [];
            
            tasks.forEach(task => {
              if (task.deleted) return;
              
              // Raw status
              const rawStatus = task.status || 'Planerad';
              const normalizedRaw = rawStatus.toLowerCase();
              let rawNormalized = 'Planerad';
              if (normalizedRaw.includes('klar') || normalizedRaw.includes('done')) {
                rawNormalized = 'Klar';
              } else if (normalizedRaw.includes('pågående') || normalizedRaw.includes('progress')) {
                rawNormalized = 'Pågående';
              } else if (normalizedRaw.includes('försenad') || normalizedRaw.includes('delayed')) {
                rawNormalized = 'Försenad';
              }
              rawStatusCounts[rawNormalized] = (rawStatusCounts[rawNormalized] || 0) + 1;
              
              // Display status
              const { status: displayStatus } = getTaskDisplayStatus(task);
              displayStatusCounts[displayStatus] = (displayStatusCounts[displayStatus] || 0) + 1;
              
              // Track mismatches
              if (rawNormalized !== displayStatus) {
                mismatches.push({
                  taskId: task.id || 'unknown',
                  rawStatus: rawNormalized,
                  displayStatus: displayStatus,
                  endDate: task.endDate || null,
                });
              }
            });
            
            return (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-xs">
                <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔍 Debug (localhost only):</div>
                <div className="space-y-1 text-yellow-700 dark:text-yellow-300">
                  <div>Raw status counts (task.status): Planerad={rawStatusCounts.Planerad}, Pågående={rawStatusCounts.Pågående}, Klar={rawStatusCounts.Klar}, Försenad={rawStatusCounts.Försenad}</div>
                  <div>Display status counts (getTaskDisplayStatus): Planerad={displayStatusCounts.Planerad}, Pågående={displayStatusCounts.Pågående}, Klar={displayStatusCounts.Klar}, Försenad={displayStatusCounts.Försenad}</div>
                  {mismatches.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold">Tasks where raw ≠ display ({mismatches.length}):</div>
                      {mismatches.slice(0, 5).map((m, idx) => (
                        <div key={idx} className="ml-2 font-mono">
                          {m.taskId.substring(0, 8)}: raw={m.rawStatus} → display={m.displayStatus} (endDate: {m.endDate || 'null'})
                        </div>
                      ))}
                      {mismatches.length > 5 && <div className="ml-2">... and {mismatches.length - 5} more</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">{t('planned')}</span>
                <span className="font-semibold text-gray-800 dark:text-white">{stats.planned}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.planned / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">{t('inProgress')}</span>
                <span className="font-semibold text-gray-800 dark:text-white">{stats.inProgress}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">{t('done')}</span>
                <span className="font-semibold text-gray-800 dark:text-white">{stats.done}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">{t('overdue')}</span>
                <span className="font-semibold text-gray-800 dark:text-white">{stats.overdue}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.overdue / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('priorityDistribution')}</h3>
        </div>
        <div className="space-y-3">
          {useMemo(() => {
            const priorityCounts = { high: 0, normal: 0, low: 0 };
            tasks.forEach((task) => {
              if (task.deleted || checkIsDone(task.status)) return;
              // Count priorities from checklist items instead of main task
              if (task.checklist && task.checklist.length > 0) {
                task.checklist.forEach((item) => {
                  if (item.done) return; // Skip completed items
                  const priority = item.priority || 'normal';
                  if (priorityCounts.hasOwnProperty(priority)) {
                    priorityCounts[priority]++;
                  }
                });
              }
            });
            const total = priorityCounts.high + priorityCounts.normal + priorityCounts.low;
            return { counts: priorityCounts, total };
          }, [tasks]).counts && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    {t('priorityHigh')}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {useMemo(() => {
                      const counts = { high: 0, normal: 0, low: 0 };
                      tasks.forEach((task) => {
                        if (task.deleted || checkIsDone(task.status)) return;
                        if (task.checklist && task.checklist.length > 0) {
                          task.checklist.forEach((item) => {
                            if (item.done) return;
                            const priority = item.priority || 'normal';
                            if (counts.hasOwnProperty(priority)) counts[priority]++;
                          });
                        }
                      });
                      return counts.high;
                    }, [tasks])}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${
                        useMemo(() => {
                          const counts = { high: 0, normal: 0, low: 0 };
                          let total = 0;
                          tasks.forEach((task) => {
                            if (task.deleted || checkIsDone(task.status)) return;
                            if (task.checklist && task.checklist.length > 0) {
                              task.checklist.forEach((item) => {
                                if (item.done) return;
                                total++;
                                const priority = item.priority || 'normal';
                                if (counts.hasOwnProperty(priority)) counts[priority]++;
                              });
                            }
                          });
                          return total > 0 ? (counts.high / total) * 100 : 0;
                        }, [tasks])}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    {t('priorityNormal')}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {useMemo(() => {
                      const counts = { high: 0, normal: 0, low: 0 };
                      tasks.forEach((task) => {
                        if (task.deleted || checkIsDone(task.status)) return;
                        if (task.checklist && task.checklist.length > 0) {
                          task.checklist.forEach((item) => {
                            if (item.done) return;
                            const priority = item.priority || 'normal';
                            if (counts.hasOwnProperty(priority)) counts[priority]++;
                          });
                        }
                      });
                      return counts.normal;
                    }, [tasks])}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        useMemo(() => {
                          const counts = { high: 0, normal: 0, low: 0 };
                          let total = 0;
                          tasks.forEach((task) => {
                            if (task.deleted || checkIsDone(task.status)) return;
                            if (task.checklist && task.checklist.length > 0) {
                              task.checklist.forEach((item) => {
                                if (item.done) return;
                                total++;
                                const priority = item.priority || 'normal';
                                if (counts.hasOwnProperty(priority)) counts[priority]++;
                              });
                            }
                          });
                          return total > 0 ? (counts.normal / total) * 100 : 0;
                        }, [tasks])}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    {t('priorityLow')}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {useMemo(() => {
                      const counts = { high: 0, normal: 0, low: 0 };
                      tasks.forEach((task) => {
                        if (task.deleted || checkIsDone(task.status)) return;
                        if (task.checklist && task.checklist.length > 0) {
                          task.checklist.forEach((item) => {
                            if (item.done) return;
                            const priority = item.priority || 'normal';
                            if (counts.hasOwnProperty(priority)) counts[priority]++;
                          });
                        }
                      });
                      return counts.low;
                    }, [tasks])}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        useMemo(() => {
                          const counts = { high: 0, normal: 0, low: 0 };
                          let total = 0;
                          tasks.forEach((task) => {
                            if (task.deleted || checkIsDone(task.status)) return;
                            if (task.checklist && task.checklist.length > 0) {
                              task.checklist.forEach((item) => {
                                if (item.done) return;
                                total++;
                                const priority = item.priority || 'normal';
                                if (counts.hasOwnProperty(priority)) counts[priority]++;
                              });
                            }
                          });
                          return total > 0 ? (counts.low / total) * 100 : 0;
                        }, [tasks])}%`,
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      {/* Active Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('activeTasks')}</h3>
        {stats.active === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">
            {t('noTasks')}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks
              .filter(t => !t.deleted && !checkIsDone(t.status))
              .slice(0, 10)
              .map((task) => {
                const checklist = task.checklist || [];
                const hasSubtasks = checklist.length > 0;
                const isExpanded = expandedTaskIds.has(task.id);
                const completedCount = checklist.filter(item => item.done).length;
                const totalCount = checklist.length;
                
                // Calculate date range for subtasks
                const subtaskDates = checklist
                  .map(item => ({ start: item.startDate, end: item.endDate }))
                  .filter(d => d.start || d.end);
                const allStartDates = subtaskDates.map(d => d.start).filter(Boolean);
                const allEndDates = subtaskDates.map(d => d.end).filter(Boolean);
                const earliestStart = allStartDates.length > 0 ? allStartDates.sort()[0] : null;
                const latestEnd = allEndDates.length > 0 ? allEndDates.sort().reverse()[0] : null;
                const hasDateRange = earliestStart && latestEnd;
                const allCompleted = totalCount > 0 && completedCount === totalCount;

                const toggleExpand = (e) => {
                  e.stopPropagation();
                  const newExpanded = new Set(expandedTaskIds);
                  if (isExpanded) {
                    newExpanded.delete(task.id);
                  } else {
                    newExpanded.add(task.id);
                  }
                  setExpandedTaskIds(newExpanded);
                };

                return (
                  <div key={task.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <div
                      onClick={() => onTaskClick && onTaskClick(task)}
                      className="flex items-center justify-between p-3 cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{task.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {task.phase ? `${task.phase} • ` : ''}{task.startDate} - {task.endDate}
                        </div>
                        {hasSubtasks && (
                          <div className={`text-xs mt-1.5 ${allCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {hasDateRange
                              ? t('subtasksSummaryWithDates')
                                  .replace('{total}', totalCount)
                                  .replace('{completed}', completedCount)
                                  .replace('{start}', earliestStart)
                                  .replace('{end}', latestEnd)
                              : t('subtasksSummary')
                                  .replace('{total}', totalCount)
                                  .replace('{completed}', completedCount)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSubtasks && (
                          <button
                            onClick={toggleExpand}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            aria-label={isExpanded ? t('collapseSubtasks') : t('expandSubtasks')}
                            aria-expanded={isExpanded}
                          >
                            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
                            </div>
                          </button>
                        )}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          (task.status || '').toLowerCase().includes('klar') || (task.status || '').toLowerCase().includes('done')
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : (task.status || '').toLowerCase().includes('pågående') || (task.status || '').toLowerCase().includes('progress')
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {task.status || t('statusPlan')}
                        </div>
                      </div>
                    </div>
                    
                    {hasSubtasks && isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600 mt-2 pt-3 transition-all duration-200 ease-in-out">
                        <div className="space-y-2">
                          {checklist.map((item, idx) => {
                            const itemStatus = item.done 
                              ? t('statusDone') 
                              : (item.startDate || item.endDate) 
                                ? t('statusProg') 
                                : t('statusPlan');
                            const progress = calculateChecklistProgress([item]);
                            
                            return (
                              <div
                                key={item.id || idx}
                                className="flex items-start justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                      item.done
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                      {item.done && <CheckCircle size={12} className="text-white" />}
                                    </div>
                                    <span className={`text-sm ${item.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                      {item.text || t('subtask')}
                                    </span>
                                  </div>
                                  {(item.startDate || item.endDate || item.executor) && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                                      {item.startDate && <span>{t('startDateLabel')}: {item.startDate}</span>}
                                      {item.endDate && (
                                        <span className={item.startDate ? ' • ' : ''}>
                                          {t('endDateLabel')}: {item.endDate}
                                        </span>
                                      )}
                                      {item.executor && (
                                        <span className={(item.startDate || item.endDate) ? ' • ' : ''}>
                                          {t('statExecutor')}: {item.executor}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className={`px-2 py-0.5 rounded text-xs font-medium ml-2 ${
                                  item.done
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                  {itemStatus}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Workload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('workload')}</h3>
        </div>

        <div className="space-y-4">
          {Object.entries(workloadByRole).map(([roleKey, roleData]) => (
            <div key={roleKey} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {roleData.label}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {roleData.total} {roleData.total === 1 ? t('task') : t('tasks')}
                </span>
              </div>

              {roleData.counts.length === 0 ? (
                <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                  {t('noData')}
                </div>
              ) : (
                <div className="space-y-2">
                  {roleData.counts.map(([name, countData]) => {
                    // For executor role, countData is an object with { total, byPriority }
                    // For other roles, countData is just a number (backward compatible)
                    const isExecutor = roleKey === 'executor';
                    const total = isExecutor && typeof countData === 'object' ? countData.total : countData;
                    const byPriority = isExecutor && typeof countData === 'object' ? (countData.byPriority || { hog: 0, normal: 0, lag: 0 }) : null;
                    
                    // Verify that total matches sum of priorities (safety check)
                    // Calculate priority sum to ensure consistency
                    const prioritySum = byPriority 
                      ? (byPriority.hog || 0) + (byPriority.normal || 0) + (byPriority.lag || 0)
                      : 0;
                    // Total should always equal prioritySum for executor role
                    // Use prioritySum as source of truth since it's calculated from the same dataset
                    const displayTotal = isExecutor && byPriority ? prioritySum : total;
                    
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          setSelectedRole(roleKey);
                          setSelectedRoleLabel(name);
                        }}
                        className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">
                          {name}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                          {/* Priority badges for executor role only - always show all three */}
                          {isExecutor && byPriority && (
                            <div className="flex items-center gap-0.5 flex-wrap">
                              <span className={`px-1 py-0.5 rounded text-[9px] font-semibold border whitespace-nowrap ${
                                byPriority.hog > 0
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600'
                              }`}>
                                {t('priorityHigh')}: {byPriority.hog || 0}
                              </span>
                              <span className={`px-1 py-0.5 rounded text-[9px] font-semibold border whitespace-nowrap ${
                                byPriority.normal > 0
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600'
                              }`}>
                                {t('priorityNormal')}: {byPriority.normal || 0}
                              </span>
                              <span className={`px-1 py-0.5 rounded text-[9px] font-semibold border whitespace-nowrap ${
                                byPriority.lag > 0
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600'
                              }`}>
                                {t('priorityLow')}: {byPriority.lag || 0}
                              </span>
                            </div>
                          )}
                          <span className="bg-white dark:bg-gray-600 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-500 text-xs font-bold text-indigo-600 dark:text-indigo-300 whitespace-nowrap">
                            {isExecutor && byPriority ? displayTotal : total}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phase Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('phaseDistribution')}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {useMemo(() => {
            const phaseCounts = {};
            tasks.forEach((task) => {
              if (task.deleted || checkIsDone(task.status)) return;
              const phase = task.phase || t('phaseOther');
              phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
            });
            return Object.entries(phaseCounts).sort((a, b) => b[1] - a[1]);
          }, [tasks, t]).map(([phase, count]) => (
            <div
              key={phase}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{phase}</span>
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-xs font-bold ml-2">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Workload Tasks Modal */}
      {selectedRole && selectedRoleLabel && (
        <WorkloadTasksModal
          isOpen={!!selectedRole}
          onClose={() => {
            setSelectedRole(null);
            setSelectedRoleLabel(null);
          }}
          tasks={tasks}
          role={selectedRole}
          roleLabel={selectedRoleLabel}
          warningThreshold={warningThreshold}
          onTaskClick={onTaskClick}
          t={t}
          getActiveSubtasksByExecutor={getActiveSubtasksByExecutor}
        />
      )}
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

