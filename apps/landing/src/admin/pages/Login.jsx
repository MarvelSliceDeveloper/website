import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { trackLogin } from "../../lib/analytics";
import { SubmitButton } from "../components/FormButtons";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      trackLogin("admin");
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black">Marvel Slice</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Sign in to the admin panel
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-admin-200 shadow-sm p-6 space-y-5"
        >
          {error && (
            <div className="p-3 bg-destructive-50 border border-destructive-200 rounded-lg text-sm text-destructive-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              placeholder="admin@marvelslice.com"
              className="w-full h-10 px-3 border border-admin-200 rounded-lg text-sm text-admin-900 placeholder-admin-400 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-10 px-3 pr-10 border border-admin-200 rounded-lg text-sm text-admin-900 placeholder-admin-400 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-400 hover:text-admin-600 transition-colors"
              >
                {showPw ? (
                  <FiEyeOff className="w-4 h-4" />
                ) : (
                  <FiEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <SubmitButton
            type="submit"
            saving={loading}
            savingLabel="Signing in..."
            label="Sign In"
            className="w-full"
          />
        </form>
      </div>
    </div>
  );
}
