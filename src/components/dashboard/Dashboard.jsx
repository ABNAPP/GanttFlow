import { memo, useMemo, useState } from 'react';
import { BarChart3, CheckCircle, Clock, AlertTriangle, Calendar, Filter, Users, Layers, Tag, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { checkIsDone, calculateChecklistProgress, hasOverdueChecklistItems, getTimeStatus } from '../../utils/helpers';
import { WorkloadTasksModal } from '../modals/WorkloadTasksModal';

export const Dashboard = memo(({ tasks, t, onTaskClick, warningThreshold }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRoleLabel, setSelectedRoleLabel] = useState(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
  const stats = useMemo(() => {
    if (!Array.isArray(tasks)) return null;

    const active = tasks.filter(t => !t.deleted && !checkIsDone(t.status));
    const done = tasks.filter(t => !t.deleted && checkIsDone(t.status));
    
    // Försenade projekt (huvuduppgifter)
    const overdueProjects = active.filter(t => {
      if (!t.endDate) return false;
      const end = new Date(t.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return end < today;
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
    
    const planned = active.filter(t => (t.status || '').toLowerCase().includes('planerad') || (t.status || '').toLowerCase().includes('planned'));
    const inProgress = active.filter(t => (t.status || '').toLowerCase().includes('pågående') || (t.status || '').toLowerCase().includes('progress'));

    return {
      total: tasks.filter(t => !t.deleted).length,
      active: active.length,
      done: done.length,
      overdue: overdueProjects.length, // Keep for backward compatibility
      overdueProjects: overdueProjects.length,
      overdueSubtasks: overdueSubtasksCount,
      planned: planned.length,
      inProgress: inProgress.length,
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
      
      tasks.forEach((task) => {
        if (task.deleted) return;
        if (checkIsDone(task.status)) return;
        
        if (key === 'executor') {
          // For HL, check checklist items
          (task.checklist || []).forEach((item) => {
            const val = item.executor && item.executor.trim() !== '' ? item.executor.trim() : null;
            if (val) {
              // Normalize name (case-insensitive) for aggregation
              const normalized = val.toLowerCase();
              // Preserve original case of first occurrence
              if (!nameMap[normalized]) {
                nameMap[normalized] = val;
              }
              counts[normalized] = (counts[normalized] || 0) + 1;
            }
          });
        } else {
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
    });

    return result;
  }, [tasks, t]);

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

    const active = tasks.filter(t => !t.deleted && !checkIsDone(t.status));
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

    // Overdue tasks
    const overdue = active.filter(t => {
      if (!t.endDate) return false;
      const end = new Date(t.endDate);
      return end < today;
    });

    // Tasks starting this week
    const thisWeek = active.filter(t => {
      if (!t.startDate) return false;
      const start = new Date(t.startDate);
      return start >= startOfWeek && start <= endOfWeek;
    });

    // Status distribution for pie chart
    const statusCounts = active.reduce((acc, task) => {
      const status = task.status || 'Planerad';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

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

      {/* Status Distribution and Priority Distribution - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-[65%_35%] gap-3 sm:gap-4">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('statusDistribution')}</h3>
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
                  {roleData.counts.map(([name, count]) => (
                    <button
                      key={name}
                      onClick={() => {
                        setSelectedRole(roleKey);
                        setSelectedRoleLabel(name);
                      }}
                      className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {name}
                      </span>
                      <span className="bg-white dark:bg-gray-600 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-500 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        {count}
                      </span>
                    </button>
                  ))}
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
        />
      )}
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

