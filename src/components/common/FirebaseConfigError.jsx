/**
 * FirebaseConfigError - Displays user-friendly Firebase configuration error
 */
import { memo } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { isFirebaseInitialized, getFirebaseErrorMessage, firebaseError, isLocalDev } from '../../config/firebase';

export const FirebaseConfigError = memo(({ onDismiss, t }) => {
  // Only show if Firebase is not initialized
  if (isFirebaseInitialized() || !firebaseError) {
    return null;
  }

  const errorMessage = getFirebaseErrorMessage();
  const isDev = isLocalDev();

  return (
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[300] max-w-2xl w-full mx-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              {t?.('firebaseConfigError') || 'Firebase-konfiguration saknas'}
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              {errorMessage || 'Firebase är inte korrekt konfigurerad. Vissa funktioner kan vara begränsade.'}
            </p>
            
            {isDev ? (
              <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Info className="text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Utvecklingsläge:</p>
                    <p>Appen använder fallback-värden. För produktion, sätt miljövariabler:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>VITE_FIREBASE_API_KEY</li>
                      <li>VITE_FIREBASE_AUTH_DOMAIN</li>
                      <li>VITE_FIREBASE_PROJECT_ID</li>
                      <li>VITE_FIREBASE_STORAGE_BUCKET</li>
                      <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
                      <li>VITE_FIREBASE_APP_ID</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Info className="text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Produktionsläge:</p>
                    <p>Kontakta administratören för att konfigurera Firebase-miljövariabler.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              {t?.('firebaseConfigNote') || 'Appen kan fortfarande köras i begränsat läge med lokal lagring.'}
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors"
              aria-label={t?.('dismiss') || 'Stäng'}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

FirebaseConfigError.displayName = 'FirebaseConfigError';
