import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authTimeout = null;

    const createMockUser = () => {
      const mockUser = {
        uid: 'demo-user-' + Date.now(),
        isAnonymous: true,
        email: null,
      };
      console.log('Creating mock user for demo mode:', mockUser.uid);
      if (isMounted) {
        setUser(mockUser);
        setLoading(false);
      }
      return mockUser;
    };

    const initAuth = async () => {
      try {
        const token = typeof window !== 'undefined' && window.__initial_auth_token;
        if (token) {
          console.log('Signing in with custom token...');
          await signInWithCustomToken(auth, token);
        } else {
          console.log('Signing in anonymously...');
          try {
            await signInAnonymously(auth);
          } catch (anonError) {
            console.warn('Anonymous auth failed:', anonError.code, anonError.message);
            // Always create mock user if auth fails
            createMockUser();
            return;
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err.code, err.message);
        // Always create mock user if auth fails
        createMockUser();
      }
    };

    // Set up auth state listener first
    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        console.log('Auth state changed:', authUser ? `User logged in (${authUser.uid})` : 'No user');
        if (isMounted) {
          setUser(authUser);
          setLoading(false);
        }
        if (authTimeout) {
          clearTimeout(authTimeout);
          authTimeout = null;
        }
      },
      (error) => {
        console.error('Auth state change error:', error.code, error.message);
        // Always create mock user on error
        createMockUser();
      }
    );

    // Initialize auth
    initAuth();

    // Fallback: if no user after 2 seconds, create mock user
    authTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('Auth timeout - creating mock user as fallback');
        createMockUser();
      }
    }, 2000);

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  return { user, loading };
};

