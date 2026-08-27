import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount: check browser session state or tab sync before restoring session
  useEffect(() => {
    let mounted = true;
    let authChannel = null;

    if (typeof BroadcastChannel !== 'undefined') {
      authChannel = new BroadcastChannel('admin_auth_channel');
    }

    async function initAuth() {
      try {
        const stored = localStorage.getItem('adminUser') || localStorage.getItem('adminUser_cache');
        const rememberMe = localStorage.getItem('admin_remember_me') === 'true';
        const hasSessionFlag = sessionStorage.getItem('admin_session_active') === 'true';

        if (stored && mounted) {
          let isValidSession = hasSessionFlag || rememberMe;

          // If no session flag in current tab and rememberMe is false, query other open tabs
          if (!isValidSession && authChannel) {
            isValidSession = await new Promise((resolve) => {
              let responded = false;
              const handleMessage = (e) => {
                if (e.data?.type === 'PONG_SESSION') {
                  responded = true;
                  authChannel.removeEventListener('message', handleMessage);
                  resolve(true);
                }
              };
              authChannel.addEventListener('message', handleMessage);
              authChannel.postMessage({ type: 'PING_SESSION' });

              setTimeout(() => {
                authChannel.removeEventListener('message', handleMessage);
                if (!responded) resolve(false);
              }, 100);
            });
          }

          if (isValidSession) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.id) {
                setUser(parsed);
                sessionStorage.setItem('admin_session_active', 'true');
              }
            } catch {
              localStorage.removeItem('adminUser');
              localStorage.removeItem('adminUser_cache');
              localStorage.removeItem('admin_remember_me');
              sessionStorage.removeItem('admin_session_active');
            }
          } else {
            // Browser was closed and reopened without 'Remember Me', logout
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminUser_cache');
            localStorage.removeItem('admin_remember_me');
            localStorage.removeItem('admin_last_activity');
            sessionStorage.removeItem('admin_session_active');
            setUser(null);
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

    // Listen for tab sync messages
    const handleChannelMessage = (e) => {
      if (!mounted) return;
      if (e.data?.type === 'PING_SESSION') {
        if (sessionStorage.getItem('admin_session_active') === 'true') {
          authChannel?.postMessage({ type: 'PONG_SESSION' });
        }
      } else if (e.data?.type === 'LOGOUT') {
        setUser(null);
        setSession(null);
        sessionStorage.removeItem('admin_session_active');
      }
    };

    authChannel?.addEventListener('message', handleChannelMessage);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminUser_cache');
        localStorage.removeItem('admin_remember_me');
        sessionStorage.removeItem('admin_session_active');
      }
    });

    return () => {
      mounted = false;
      authChannel?.removeEventListener('message', handleChannelMessage);
      authChannel?.close();
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password, remember = false) => {
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

    // Save session state
    localStorage.setItem('adminUser', JSON.stringify(userData));
    localStorage.setItem('adminUser_cache', JSON.stringify(userData));
    localStorage.setItem('admin_last_activity', String(Date.now()));
    sessionStorage.setItem('admin_session_active', 'true');
    sessionStorage.removeItem('admin_session_expired');

    if (remember) {
      localStorage.setItem('admin_remember_me', 'true');
    } else {
      localStorage.removeItem('admin_remember_me');
    }

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
      localStorage.removeItem('admin_remember_me');
      sessionStorage.removeItem('admin_session_active');
      setUser(null);
      setSession(null);

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('admin_auth_channel');
          bc.postMessage({ type: 'LOGOUT' });
          bc.close();
        }
      } catch {
        // BroadcastChannel fallback
      }
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
