/**
 * AuthScreen Component
 * 
 * Handles user authentication (login and registration) with email and password.
 */
import { useState } from 'react';
import { Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';

export const AuthScreen = ({ onLogin, onRegister, t }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError(t('authErrorRequired') || 'E-post och lösenord krävs');
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError(t('authErrorPasswordMatch') || 'Lösenorden matchar inte');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('authErrorPasswordLength') || 'Lösenordet måste vara minst 6 tecken');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await onLogin(email, password);
      } else {
        result = await onRegister(email, password);
      }

      if (!result.success) {
        // Translate common Firebase error codes
        let errorMessage = result.error;
        if (result.code === 'auth/user-not-found') {
          errorMessage = t('authErrorUserNotFound') || 'Användaren finns inte';
        } else if (result.code === 'auth/wrong-password') {
          errorMessage = t('authErrorWrongPassword') || 'Fel lösenord';
        } else if (result.code === 'auth/email-already-in-use') {
          errorMessage = t('authErrorEmailInUse') || 'E-postadressen används redan';
        } else if (result.code === 'auth/weak-password') {
          errorMessage = t('authErrorWeakPassword') || 'Lösenordet är för svagt';
        } else if (result.code === 'auth/invalid-email') {
          errorMessage = t('authErrorInvalidEmail') || 'Ogiltig e-postadress';
        }
        setError(errorMessage);
      } else {
        // Success - form will be cleared by parent component
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(t('authErrorGeneric') || 'Ett fel uppstod. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title') || 'Projektplanering'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin 
              ? (t('authLoginSubtitle') || 'Logga in för att fortsätta')
              : (t('authRegisterSubtitle') || 'Skapa ett konto för att komma igång')
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('authEmail') || 'E-post'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('authEmailPlaceholder') || 'din@epost.se'}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('authPassword') || 'Lösenord'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('authPasswordPlaceholder') || '••••••••'}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          {/* Confirm Password (only for registration) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('authConfirmPassword') || 'Bekräfta lösenord'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('authPasswordPlaceholder') || '••••••••'}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{t('loading') || 'Laddar...'}</span>
              </>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                <span>{t('authLogin') || 'Logga in'}</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>{t('authRegister') || 'Skapa konto'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            disabled={loading}
          >
            {isLogin ? (
              <>
                {t('authNoAccount') || 'Har du inget konto?'}{' '}
                <span className="font-medium">{t('authRegisterLink') || 'Skapa konto'}</span>
              </>
            ) : (
              <>
                {t('authHasAccount') || 'Har du redan ett konto?'}{' '}
                <span className="font-medium">{t('authLoginLink') || 'Logga in'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

