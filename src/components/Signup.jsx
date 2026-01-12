import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner, faUser, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import LanguageSwitcher from './LanguageSwitcher';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';
import { useTranslation } from '../../node_modules/react-i18next';
import LoadingLogo from './LoadingLogo';

const Signup = () => {
const { t, i18n } = useTranslation();

const [name, setName] = useState("")
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [showPassword, setShowPassword] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(false)
const [emailSent, setEmailSent] = useState(false)
const [showPrivacyModal, setShowPrivacyModal] = useState(false)
const [showTermsModal, setShowTermsModal] = useState(false)

const {signUpNewUser, signInWithGoogle} = UserAuth()
const navigate = useNavigate()


const handleReturningHome = (e) =>{
  e.preventDefault()
  navigate("/signin")
}

const handleGoogleSignIn = async () => {
  const result = await signInWithGoogle()
  if (!result.success) {
    setError('Failed to sign in with Google. Please try again.')
  }
}

const handleSignup = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError(false)

  try {
    const results = await signUpNewUser(email, password, name)
    if(results.success){
      setEmailSent(true)
    } else if (results.error) {
      if (results.error.message?.includes('already registered') || 
          results.error.message?.includes('already exists')) {
        setError('You already have an account! Please sign in instead.')
      } else {
        setError(results.error.message || 'An error occurred during signup')
      }
    }


  } catch (err) {
    setError('an error occured')
  } finally {
    setLoading(false)
  }

}

if (emailSent) {
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
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">Check your email</h2>
            <p className="text-sm text-zinc-400 mb-6">Please check your email for verification</p>
            <button 
              className="w-full py-2.5 bg-white hover:bg-zinc-100 text-white font-semibold rounded-md transition-colors text-sm"
              onClick={handleReturningHome}
            >
              Return to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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
      <p className="text-sm text-zinc-400">{t('startYourLearningJourney')}</p>
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
      <form onSubmit={handleSignup} className="space-y-4">
        
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="userName" className="block text-sm font-medium text-zinc-200">
            {t('name')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faUser} className="text-zinc-500 text-sm" />
            </div>
            <input 
              className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-3 rtl:pl-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition"
              type="text"
              name="name"
              id="userName" 
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="userNewEmail" className="block text-sm font-medium text-zinc-200">
            {t('email')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faEnvelope} className="text-zinc-500 text-sm" />
            </div>
            <input 
              className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-3 rtl:pl-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition"
              type="email"
              name="newEmail"
              id="userNewEmail" 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="youremail@example.com"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="userNewPassword" className="block text-sm font-medium text-zinc-200">
            {t('password')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-zinc-500 text-sm" />
            </div>
            <input 
              className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-12 rtl:pl-12 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition"
              type={showPassword ? "text" : "password"}
              name="newPassword"
              id="userNewPassword"
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
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingLogo size="sm" />
              {t('creatingAccount')}
            </span>
          ) : (
            <span>{t('signup')}</span>
          )}
        </button>

      </form>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-400">
          {t('alreadyHaveAccount')}{' '}
          <Link 
            to="/signin" 
            className="text-zinc-200 font-medium hover:text-white transition-colors underline underline-offset-2"
          >
            {t('signin')}
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

export default Signup;