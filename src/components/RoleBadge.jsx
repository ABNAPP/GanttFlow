import { memo } from 'react';

export const RoleBadge = memo(({ label, value, color = 'text-gray-400 dark:text-gray-500' }) => {
  if (!value) return null;

  return (
    <div className="flex items-center gap-1 text-[9px] min-w-[40px]">
      <span className={`font-bold ${color}`}>{label}:</span>
      <span className="text-gray-600 dark:text-gray-300 truncate max-w-[60px]">
        {value}
      </span>
    </div>
  );
});

RoleBadge.displayName = 'RoleBadge';

