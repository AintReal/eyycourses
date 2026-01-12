import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import AccessCodeModal from './AccessCodeModal';
import LanguageSwitcher from './LanguageSwitcher';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';
import LoadingLogo from './LoadingLogo';
import { useTranslation } from '../../node_modules/react-i18next';

const Signin = () => {
const { t, i18n } = useTranslation();
const location = useLocation();

const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [showPassword, setShowPassword] = useState(false)
const [loading, setLoading] = useState(false)
const [navigating, setNavigating] = useState(false)
const [error, setError] = useState(false)
const [showCodeModal, setShowCodeModal] = useState(false)
const [showPrivacyModal, setShowPrivacyModal] = useState(false)
const [showTermsModal, setShowTermsModal] = useState(false)
const [loginAttempts, setLoginAttempts] = useState(0)
const [lockoutTime, setLockoutTime] = useState(null)

const {session, signInUser, signInWithGoogle, validateAccessCode} = UserAuth()
const navigate = useNavigate()


useEffect(() => {
  if (location.state?.error) {
    setError(location.state.error);

    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state]);

// Handle email verification redirect
useEffect(() => {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {

    window.history.replaceState(null, '', window.location.pathname);
    setError('Email verified! Please sign in with your credentials.');
  }
}, []);


useEffect(() => {
  if (session) {
    const codeValidated = session.user?.user_metadata?.code_validated;
    if (codeValidated) {
      setNavigating(true);
      navigate("/dashboard")
    } else {
      setShowCodeModal(true)
    }
  }
  
  const savedLockout = localStorage.getItem('userLoginLockout');
  if (savedLockout) {
    const lockoutData = JSON.parse(savedLockout);
    const now = Date.now();
    if (now < lockoutData.until) {
      setLockoutTime(lockoutData.until);
      setError(`Too many attempts. Try again in ${Math.ceil((lockoutData.until - now) / 1000)} seconds`);
    } else {
      localStorage.removeItem('userLoginLockout');
    }
  }
}, [session, navigate])

useEffect(() => {
  if (lockoutTime) {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockoutTime) {
        setLockoutTime(null);
        setError('');
        setLoginAttempts(0);
        localStorage.removeItem('userLoginLockout');
      } else {
        setError(`Too many attempts. Try again in ${Math.ceil((lockoutTime - now) / 1000)} seconds`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }
}, [lockoutTime])

const handleGoogleSignIn = async () => {
  const result = await signInWithGoogle()
  if (!result.success) {
    setError('Failed to sign in with Google. Please try again.')
  }
}

const handleCodeValidation = async (code) => {
  const result = await validateAccessCode(code);
  return result;
}

const handleCodeSuccess = () => {
  setShowCodeModal(false);
  setNavigating(true);
  navigate("/dashboard");
}

const handleSignin = async (e) => {
  e.preventDefault()
  
  if (lockoutTime && Date.now() < lockoutTime) {
    return;
  }
  
  setLoading(true)

  try {
    const results = await signInUser(email, password)
    if(results.success){
      setLoginAttempts(0);
      localStorage.removeItem('userLoginLockout');
      
      const codeValidated = results.data?.user?.user_metadata?.code_validated;
      if (!codeValidated) {
        setShowCodeModal(true);
        setLoading(false);
      } else {
        setNavigating(true);
        navigate("/dashboard");
      }
    } else if(!results.success){
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      // User rate limiting (3 minute lockout)
      if (newAttempts >= 5) {
        const lockUntil = Date.now() + (3 * 60 * 1000); // 3 minutes
        setLockoutTime(lockUntil);
        localStorage.setItem('userLoginLockout', JSON.stringify({ until: lockUntil }));
        setError('Too many failed attempts. Please try again in 3 minutes.');
      } else {
        if(results.error?.includes('Email not confirmed') || results.error?.includes('not confirmed')) {
          setError('Please verify your email before signing in. Check your inbox!')
        } else {
          setError(`Email or password is wrong. ${5 - newAttempts} attempts remaining.`)
        }
      }
      setLoading(false);
    }

  

  } catch (err) {
    setError('an error occured')
    setLoading(false);
  }

}


if (navigating) {
  return (
    <div className="min-h-screen h-screen bg-black flex items-center justify-center">
      <LoadingLogo size="xl" />
    </div>
  );
}


if (showCodeModal && session) {
  return <AccessCodeModal onValidate={handleCodeValidation} onSuccess={handleCodeSuccess} />
}


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
      <p className="text-sm text-zinc-400">{t('accessYourLearningJourney')}</p>
    </div>

    {/* Card */}
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-8 shadow-2xl">
      
      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
      >
        <img src="/google.png" alt="Google" className="w-5 h-5" />
        <span className="text-sm">{t('continueWithGoogle')}</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-zinc-800 grow"></div>
        <span className="px-4 text-xs text-zinc-500 uppercase tracking-wider">or</span>
        <div className="border-t border-zinc-800 grow"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSignin} className="space-y-4">
        
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="userEmail" className="block text-sm font-medium text-zinc-200">
            {t('email')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faEnvelope} className="text-zinc-500 text-sm" />
            </div>
            <input 
              className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-3 rtl:pl-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition"
              type="email"
              name="email"
              id="userEmail" 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="youremail@example.com"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="userPassword" className="block text-sm font-medium text-zinc-200">
            {t('password')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-zinc-500 text-sm" />
            </div>
            <input 
              className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-12 rtl:pl-12 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition"
              type={showPassword ? "text" : "password"}
              name="password"
              id="userPassword"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors"
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

        {/* Submit Button */}
        <button 
          className="w-full py-2.5 bg-white hover:bg-zinc-100 text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-6"
          type="submit"
          disabled={loading || lockoutTime}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              {t('signingIn')}
            </span>
          ) : (
            <span>{t('signin')}</span>
          )}
        </button>

      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-400">
          {t('dontHaveAccount')}{' '}
          <Link 
            to="/signup" 
            className="text-zinc-200 font-medium hover:text-white transition-colors underline underline-offset-2"
          >
            {t('signup')}
          </Link>
          {' · '}
          <LanguageSwitcher />
        </p>
      </div>
    </div>

    {/* Footer */}
    <div className="mt-8 text-center">
      <p className="text-zinc-500 text-xs">
        © 2026 eyycourses · {t('allRightsReserved')}
      </p>
      <div className="mt-2 flex items-center justify-center gap-3 text-xs">
        <a 
          onClick={() => setShowPrivacyModal(true)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors underline cursor-pointer"
        >
          {t('privacyPolicyLink')}
        </a>
        <span className="text-zinc-700">·</span>
        <a 
          onClick={() => setShowTermsModal(true)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors underline cursor-pointer"
        >
          {t('termsOfServiceLink')}
        </a>
      </div>
    </div>
    
    <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
  </div>
</div>
)
}

export default Signin;