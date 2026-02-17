import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { motion } from "framer-motion";

function Login() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [lockUntil, setLockUntil] = useState(null);

  // Load saved state from sessionStorage on component mount
  useEffect(() => {
    const savedLockUntil = sessionStorage.getItem('lockUntil');
    const savedEmail = sessionStorage.getItem('lockedEmail');
    const savedFormEmail = sessionStorage.getItem('formEmail');
    
    if (savedFormEmail) {
      setForm(prev => ({ ...prev, email: savedFormEmail }));
    }
    
    if (savedLockUntil && savedEmail) {
      const lockTime = parseInt(savedLockUntil);
      const now = Date.now();
      
      if (lockTime > now) {
        const remainingSeconds = Math.ceil((lockTime - now) / 1000);
        setLockTimeRemaining(remainingSeconds);
        startCountdown(remainingSeconds);
        setForm(prev => ({ ...prev, email: savedEmail }));
      } else {
        // Clear expired lock
        sessionStorage.removeItem('lockUntil');
        sessionStorage.removeItem('lockedEmail');
        sessionStorage.removeItem('formEmail');
      }
    }
  }, []);

  // Save email to sessionStorage when it changes
  useEffect(() => {
    if (form.email) {
      sessionStorage.setItem('formEmail', form.email);
    }
  }, [form.email]);

  const handleLogin = async (e) => {
    e?.preventDefault(); // Prevent any default behavior
    e?.stopPropagation(); // Stop event propagation
    
    if (loading || lockTimeRemaining) return;
    
    setLoading(true);
    setError("");
    setRemainingAttempts(null);

    try {
      const user = await loginUser(form.email, form.password);

      // Clear any lock data on successful login
      sessionStorage.removeItem('lockUntil');
      sessionStorage.removeItem('lockedEmail');
      sessionStorage.removeItem('formEmail');

      if (user.role === "ADMIN") {
        navigate("/admin");
      } else if (user.role === "STUDENT") {
        navigate("/student");
      } else if (user.role === "STAFF") {
        navigate("/staff");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.response?.data || "Invalid credentials";
      
      // Parse error message for remaining attempts
      if (errorMsg.includes("attempt(s) remaining")) {
        const matches = errorMsg.match(/(\d+)\s+attempt/);
        if (matches) {
          setRemainingAttempts(parseInt(matches[1]));
        }
        setError(errorMsg);
      } 
      // Parse lockout message
      else if (errorMsg.includes("locked") && errorMsg.includes("minute")) {
        const matches = errorMsg.match(/(\d+)\s+minute/);
        if (matches) {
          const minutes = parseInt(matches[1]);
          const lockTimeSeconds = minutes * 60;
          
          // Store lock expiry in sessionStorage
          const lockExpiry = Date.now() + (lockTimeSeconds * 1000);
          sessionStorage.setItem('lockUntil', lockExpiry);
          sessionStorage.setItem('lockedEmail', form.email);
          
          setLockTimeRemaining(lockTimeSeconds);
          startCountdown(lockTimeSeconds);
        }
        setError(errorMsg);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (seconds) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLockTimeRemaining(null);
          sessionStorage.removeItem('lockUntil');
          sessionStorage.removeItem('lockedEmail');
          return null;
        }
        const newValue = prev - 1;
        setLockTimeRemaining(newValue);
        return newValue;
      });
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  };

  const formatCountdown = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    setError("");
    setRemainingAttempts(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !lockTimeRemaining) {
      handleLogin(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800">Campus Resource</h1>
          <p className="text-gray-500 mt-1">Management System</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Welcome Back</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${
                lockTimeRemaining 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : remainingAttempts 
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'bg-red-50 border-red-200 text-red-600'
              } border px-4 py-3 rounded-xl mb-6 text-sm flex items-start`}
            >
              {lockTimeRemaining ? (
                <>
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="font-medium">Account Locked</p>
                    <p className="mt-1">Too many failed attempts. Please try again in {formatCountdown(countdown)}</p>
                  </div>
                </>
              ) : remainingAttempts ? (
                <>
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium">Invalid Credentials</p>
                    <p className="mt-1">{remainingAttempts} attempt(s) remaining before account lockout</p>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </>
              )}
            </motion.div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
                value={form.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={lockTimeRemaining}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 pr-12"
                  value={form.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={lockTimeRemaining}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={lockTimeRemaining}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={!lockTimeRemaining ? { scale: 1.02 } : {}}
              whileTap={!lockTimeRemaining ? { scale: 0.98 } : {}}
              onClick={handleLogin}
              type="button" // Changed from "submit" to "button"
              disabled={loading || lockTimeRemaining}
              className={`w-full py-3 rounded-xl font-medium text-white transition-all ${
                loading || lockTimeRemaining
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : lockTimeRemaining ? (
                `Locked for ${formatCountdown(countdown)}`
              ) : 'Sign In'}
            </motion.button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;   