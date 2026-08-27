import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount: load stored admin user from localStorage to persist session across page refreshes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const stored = localStorage.getItem('adminUser') || localStorage.getItem('adminUser_cache');
        if (stored && mounted) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.id) {
              setUser(parsed);
            }
          } catch {
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminUser_cache');
          }
        }

        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (activeSession && mounted) {
          setSession(activeSession);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminUser_cache');
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Email and password are required');
    }

    // Step 1: Execute server-side verify_admin RPC (bcrypt + rate limiting + audit logging)
    const { data, error } = await supabase.rpc('verify_admin', {
      p_email: cleanEmail,
      p_password: cleanPassword,
    });

    if (error) throw new Error(error.message || 'Authentication error');
    if (!data) throw new Error('Invalid email or password');

    const userData = {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role,
      profile_pic: data.profile_pic,
    };

    // Step 2: Authenticate Supabase Auth session if configured
    try {
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });
      if (authData?.session) {
        setSession(authData.session);
      }
    } catch {
      // Non-blocking fallback
    }

    // Save session in localStorage for seamless persistence on page refresh
    localStorage.setItem('adminUser', JSON.stringify(userData));
    localStorage.setItem('adminUser_cache', JSON.stringify(userData));
    localStorage.setItem('admin_last_activity', String(Date.now()));
    sessionStorage.removeItem('admin_session_expired');
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase auth signOut warning:', err);
    } finally {
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminUser_cache');
      localStorage.removeItem('admin_last_activity');
      setUser(null);
      setSession(null);
    }
  }, []);

  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const extendSession = useCallback(() => {
    localStorage.setItem('admin_last_activity', String(Date.now()));
    setShowIdleWarning(false);
  }, []);

  // Inactivity session timeout handler (15 minutes total, 13 minutes warning)
  useEffect(() => {
    if (!user) {
      setShowIdleWarning(false);
      return;
    }

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes timeout
    const WARNING_TIMEOUT_MS = 13 * 60 * 1000;    // 13 minutes warning (2m remaining)

    // Initialize activity if not set
    if (!localStorage.getItem('admin_last_activity')) {
      localStorage.setItem('admin_last_activity', String(Date.now()));
    }

    let lastUpdated = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastUpdated > 3000) { // Throttle updates to once every 3s
        lastUpdated = now;
        localStorage.setItem('admin_last_activity', String(now));
        setShowIdleWarning(false);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const intervalId = setInterval(() => {
      const lastAct = parseInt(localStorage.getItem('admin_last_activity') || '0', 10);
      const diff = Date.now() - lastAct;

      if (lastAct && diff >= INACTIVITY_TIMEOUT_MS) {
        setShowIdleWarning(false);
        sessionStorage.setItem('admin_session_expired', 'true');
        logout();
      } else if (lastAct && diff >= WARNING_TIMEOUT_MS) {
        setShowIdleWarning(true);
      } else {
        setShowIdleWarning(false);
      }
    }, 5000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(intervalId);
    };
  }, [user, logout]);

  const refreshSession = useCallback(async () => {
    const stored = localStorage.getItem('adminUser') || localStorage.getItem('adminUser_cache');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed) setUser(parsed);
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('adminUser', JSON.stringify(updated));
      localStorage.setItem('adminUser_cache', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, login, logout, updateUser, refreshSession, loading, showIdleWarning, extendSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
