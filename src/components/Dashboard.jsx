import { memo, useMemo, useState } from 'react';
import { BarChart3, CheckCircle, Clock, AlertTriangle, Calendar, Filter, Users } from 'lucide-react';
import { checkIsDone } from '../utils/helpers';
import { WorkloadTasksModal } from './WorkloadTasksModal';

export const Dashboard = memo(({ tasks, t, onTaskClick, warningThreshold }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRoleLabel, setSelectedRoleLabel] = useState(null);
  const stats = useMemo(() => {
    if (!Array.isArray(tasks)) return null;

    const active = tasks.filter(t => !t.deleted && !checkIsDone(t.status));
    const done = tasks.filter(t => !t.deleted && checkIsDone(t.status));
    const overdue = active.filter(t => {
      if (!t.endDate) return false;
      const end = new Date(t.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return end < today;
    });
    const planned = active.filter(t => (t.status || '').toLowerCase().includes('planerad') || (t.status || '').toLowerCase().includes('planned'));
    const inProgress = active.filter(t => (t.status || '').toLowerCase().includes('pågående') || (t.status || '').toLowerCase().includes('progress'));

    return {
      total: tasks.filter(t => !t.deleted).length,
      active: active.length,
      done: done.length,
      overdue: overdue.length,
      planned: planned.length,
      inProgress: inProgress.length,
    };
  }, [tasks]);

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
      tasks.forEach((task) => {
        if (task.deleted) return;
        if (checkIsDone(task.status)) return;
        const val = task[key] && task[key].trim() !== '' ? task[key] : null;
        if (val) {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      result[key] = {
        label,
        short,
        counts: Object.entries(counts).sort((a, b) => b[1] - a[1]),
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('dashboardTitle')}</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Totalt</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Aktiva</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Klar</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.done}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Försenade</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Planerade</span>
          </div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.planned}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Pågående</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.inProgress}</div>
        </div>
      </div>

      {/* Status Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Statusfördelning</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">Planerade</span>
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
              <span className="text-gray-600 dark:text-gray-300">Pågående</span>
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
              <span className="text-gray-600 dark:text-gray-300">Klar</span>
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
              <span className="text-gray-600 dark:text-gray-300">Försenade</span>
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

      {/* Belastning / Workload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                  {roleData.total} {roleData.total === 1 ? 'uppgift' : 'uppgifter'}
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

      {/* Recent Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Aktiva Uppgifter</h3>
        {stats.active === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">
            {t('noTasks')}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks
              .filter(t => !t.deleted && !checkIsDone(t.status))
              .slice(0, 10)
              .map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick && onTaskClick(task)}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{task.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {task.phase} • {task.startDate} - {task.endDate}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    (task.status || '').toLowerCase().includes('klar') || (task.status || '').toLowerCase().includes('done')
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : (task.status || '').toLowerCase().includes('pågående') || (task.status || '').toLowerCase().includes('progress')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {task.status || 'Planerad'}
                  </div>
                </div>
              ))}
          </div>
        )}
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

