import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (username === 'admin' && password === import.meta.env.VITE_ADMIN_PASS) {
      sessionStorage.setItem('adminAuth', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials');
    }
    
    setLoading(false);
  };

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
          <p className="text-gray-400 text-sm">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faUser} className="text-gray-500 text-sm" />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-gray-500 text-sm" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5">
              <p className="text-red-400 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button 
            className="w-full py-3.5 bg-white hover:bg-gray-100 active:bg-gray-200 font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:hover:shadow-lg text-[15px] mt-2"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Signing in...
              </span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
