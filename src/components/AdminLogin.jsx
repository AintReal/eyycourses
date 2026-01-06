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
      console.error('Admin login error:', err);
      
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
    <div className="min-h-screen h-screen bg-zinc-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div 
        className="absolute top-0 left-0 w-96 h-96 opacity-60" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at top left, black 0%, black 30%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle at top left, black 0%, black 30%, transparent 65%)',
          transform: 'rotate(-12deg)',
          transformOrigin: 'top left'
        }}
      ></div>

      <div 
        className="absolute top-0 right-0 w-96 h-96 opacity-60" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at top right, black 0%, black 30%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle at top right, black 0%, black 30%, transparent 65%)',
          transform: 'rotate(12deg)',
          transformOrigin: 'top right'
        }}
      ></div>

      {/* Login Card */}
      <div className="relative bg-zinc-800/50 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400 text-sm">Secure authentication required</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 text-sm" />
            </div>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLocked}
              className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-xl px-4 py-3 ltr:pl-11 rtl:pr-11
                       focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-gray-500 text-sm" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLocked}
              className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-xl px-4 py-3 ltr:pl-11 rtl:pr-11 ltr:pr-12 rtl:pl-12
                       focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            />
            <div
              onClick={() => !isLocked && setShowPassword(!showPassword)}
              className={`absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-4 rtl:pl-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors ${
                isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Attempt Counter */}
          {loginAttempts > 0 && !isLocked && (
            <div className="text-yellow-400 text-xs text-center">
              Failed attempts: {loginAttempts}/5
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-xl 
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed 
                     flex items-center justify-center gap-2 border border-zinc-600"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Authenticating...
              </>
            ) : (
              'Sign In as Admin'
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>This area is protected</p>
          <p className="mt-1">Admin access only • All attempts are logged</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
