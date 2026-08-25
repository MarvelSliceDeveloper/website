import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("adminUser");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.rpc("verify_admin", {
      p_email: email,
      p_password: password,
    });

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Invalid email or password");

    const userData = {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role,
      profile_pic: data.profile_pic,
    };
    localStorage.setItem("adminUser", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminUser");
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("adminUser", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
