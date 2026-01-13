/**
 * SkeletonLoader - Reusable skeleton loading component for better UX
 */
import { memo } from 'react';

export const SkeletonLoader = memo(({ 
  variant = 'default', 
  count = 1,
  className = '' 
}) => {
  const skeletons = Array.from({ length: count });

  if (variant === 'task') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div
            key={i}
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg p-4 mb-3 ${className}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded mt-1"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div
            key={i}
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg p-4 ${className}`}
          >
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
        ))}
      </>
    );
  }

  if (variant === 'list') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div
            key={i}
            className={`animate-pulse flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700 ${className}`}
          >
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  // Default skeleton
  return (
    <>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
          style={{ height: '1rem' }}
        />
      ))}
    </>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';
