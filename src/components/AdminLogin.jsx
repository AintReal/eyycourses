import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  }, []);

  useEffect(() => {
    checkAdminSession();
    
    const savedLockout = localStorage.getItem('adminLockout');
    if (savedLockout) {
      const lockoutData = JSON.parse(savedLockout);
      const now = Date.now();
      if (now < lockoutData.until) {
        setLockoutTime(lockoutData.until);
        setError(`Too many attempts. Try again in ${Math.ceil((lockoutData.until - now) / 1000)} seconds`);
      } else {
        localStorage.removeItem('adminLockout');
      }
    }
  }, []);

  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now >= lockoutTime) {
          setLockoutTime(null);
          setError('');
          setLoginAttempts(0);
          localStorage.removeItem('adminLockout');
        } else {
          setError(`Too many attempts. Try again in ${Math.ceil((lockoutTime - now) / 1000)} seconds`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const checkAdminSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const isAdmin = session.user.user_metadata?.is_admin === true;
      if (isAdmin) {
        navigate('/admin/dashboard');
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Rate limiting check
    if (lockoutTime && Date.now() < lockoutTime) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (signInError) throw signInError;

      const isAdmin = data.user?.user_metadata?.is_admin === true;
      
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      setLoginAttempts(0);
      localStorage.removeItem('adminLockout');
      
      navigate('/admin/dashboard');
    } catch (err) {
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      // Lock out after 5 failed attempts
      if (newAttempts >= 5) {
        const lockUntil = Date.now() + (5 * 60 * 1000);
        setLockoutTime(lockUntil);
        localStorage.setItem('adminLockout', JSON.stringify({ until: lockUntil }));
        setError('Too many failed attempts. Account locked for 5 minutes.');
      } else {
        setError(err.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockoutTime && Date.now() < lockoutTime;

  return (
    <div className="min-h-screen h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Dashed Bottom Left Fade Grid */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #27272a 1px, transparent 1px),
            linear-gradient(to bottom, #27272a 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 80% 80% at 0% 100%, #000 50%, transparent 90%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 80% 80% at 0% 100%, #000 50%, transparent 90%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <img 
              src="/croppedlogo.png" 
              alt="eyycourses" 
              className="h-24 w-auto mx-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-sm text-zinc-400">Secure authentication required</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-8 shadow-2xl">
          
          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="adminEmail" className="block text-sm font-medium text-zinc-200">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-zinc-500 text-sm" />
                </div>
                <input 
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                  type="email"
                  name="email"
                  id="adminEmail" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="adminPassword" className="block text-sm font-medium text-zinc-200">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-zinc-500 text-sm" />
                </div>
                <input 
                  className="w-full pl-10 pr-12 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="adminPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  disabled={isLocked}
                />
                <div
                  onClick={() => !isLocked && setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Attempt Counter */}
            {loginAttempts > 0 && !isLocked && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                <p className="text-yellow-400 text-sm text-center">
                  Failed attempts: {loginAttempts}/5
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button 
              className="w-full py-2.5 bg-white hover:bg-zinc-100 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-6"
              type="submit"
              disabled={loading || isLocked}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span>Sign In as Admin</span>
              )}
            </button>

          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p>Protected Area • All attempts are logged</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-xs">
            © 2026 eyycourses · All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
