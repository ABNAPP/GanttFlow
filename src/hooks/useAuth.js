import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, isLocalDev } from '../config/firebase';
import { logger } from '../utils/logger';

/**
 * Custom hook for authentication management
 * Handles user authentication state, registration, login, and logout
 * 
 * @returns {Object} Auth hook return object
 * @property {Object|null} user - Current authenticated user (Firebase User object) or null
 * @property {boolean} loading - Loading state (true while checking auth state)
 * @property {Function} register - Function to register new user
 * @property {Function} login - Function to login existing user
 * @property {Function} logout - Function to logout current user
 * 
 * @example
 * const { user, loading, login, logout } = useAuth();
 * if (loading) return <Loading />;
 * if (!user) return <LoginForm onLogin={login} />;
 * return <App user={user} onLogout={logout} />;
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading = true

  useEffect(() => {
    let isMounted = true;

    // Check if auth is initialized
    if (!auth) {
      logger.warn('[Auth] Firebase auth is not initialized. Running in limited mode.');
      if (isMounted) {
        setUser(null);
        setLoading(false);
      }
      return;
    }

    // Set up auth state listener - this will fire immediately with current auth state
    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        // Debug log for auth state changes
        const isDev = isLocalDev();
        
        // In production, reject any demo users immediately
        if (!isDev && authUser && authUser.uid && authUser.uid.startsWith('demo-user-')) {
          console.error('[Auth] PRODUCTION: Rejecting demo user - AUTH REQUIRED');
          console.error('[Auth] Demo mode is not allowed in production. Please log in with email/password.');
          if (isMounted) {
            setUser(null); // Reject demo user
            setLoading(false);
          }
          // Sign out the demo user if somehow they got through
          if (auth) {
            signOut(auth).catch(() => {});
          }
          return;
        }
        
        if (authUser) {
          const mode = authUser.uid && authUser.uid.startsWith('demo-user-') ? 'LOCAL DEMO MODE' : (isDev ? 'LOCAL DEV' : 'PRODUCTION');
          console.log(`[Auth] ${mode} - User logged in:`, authUser.uid, authUser.email || 'no email');
        } else {
          console.log(`[Auth] ${isDev ? 'LOCAL DEV' : 'PRODUCTION: AUTH REQUIRED'} - No user (showing login screen)`);
        }
        
        if (isMounted) {
          setUser(authUser);
          setLoading(false); // Set loading to false once we know the auth state
        }
      },
      (error) => {
        console.error('Auth state change error:', error.code, error.message);
        if (isMounted) {
          setUser(null);
          setLoading(false); // Set loading to false even on error
        }
      }
    );

    // Check for custom token (only if explicitly provided via env var)
    // This is for special cases, not automatic anonymous login
    // NOTE: In production, we should NOT use custom tokens for automatic login
    const isDev = isLocalDev();
    const token = typeof window !== 'undefined' && window.__initial_auth_token;
    if (token && isDev && auth) {
      // Only allow custom token in local dev
      console.log('[Auth] LOCAL DEV: Custom token detected, signing in...');
      signInWithCustomToken(auth, token).catch((err) => {
        console.error('Custom token sign-in error:', err.code, err.message);
      });
    } else if (token && !isDev) {
      console.warn('[Auth] PRODUCTION: Custom token detected but ignored - AUTH REQUIRED');
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Register a new user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, user?: Object, error?: string, code?: string}>}
   *   Returns success status, user object on success, or error message/code on failure
   * @throws {Error} If Firebase auth is not initialized
   */
  const register = async (email, password) => {
    if (!auth) {
      const error = 'Firebase auth is not initialized. Please check Firebase configuration.';
      logger.error('[Auth]', error);
      return { success: false, error, code: 'auth/not-initialized' };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Auth: user registered', userCredential.user.uid, userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Auth: registration error', error.code, error.message);
      return { success: false, error: error.message, code: error.code };
    }
  };

  /**
   * Login with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, user?: Object, error?: string, code?: string}>}
   *   Returns success status, user object on success, or error message/code on failure
   * @throws {Error} If Firebase auth is not initialized
   */
  const login = async (email, password) => {
    if (!auth) {
      const error = 'Firebase auth is not initialized. Please check Firebase configuration.';
      logger.error('[Auth]', error);
      return { success: false, error, code: 'auth/not-initialized' };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Auth: user logged in', userCredential.user.uid, userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Auth: login error', error.code, error.message);
      return { success: false, error: error.message, code: error.code };
    }
  };

  /**
   * Logout the current user
   * @returns {Promise<{success: boolean, error?: string}>}
   *   Returns success status or error message on failure
   * @throws {Error} If Firebase auth is not initialized
   */
  const logout = async () => {
    if (!auth) {
      logger.warn('[Auth]', 'Firebase auth is not initialized. Cannot logout.');
      return { success: false, error: 'Firebase auth is not initialized' };
    }
    try {
      await signOut(auth);
      console.log('Auth: user logged out');
      return { success: true };
    } catch (error) {
      console.error('Auth: logout error', error.code, error.message);
      return { success: false, error: error.message };
    }
  };

  return { user, loading, register, login, logout };
};

