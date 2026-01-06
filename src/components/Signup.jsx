import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner, faUser, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import LanguageSwitcher from './LanguageSwitcher';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';
import { useTranslation } from '../../node_modules/react-i18next';

const Signup = () => {
const { t } = useTranslation();

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
      // Handle duplicate account error
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
    <div className="min-h-screen h-screen bg-zinc-900 flex items-center justify-center px-4 relative overflow-hidden">

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
      

      <div 
        className="absolute bottom-0 left-0 w-96 h-96 opacity-60" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at bottom left, black 0%, black 30%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle at bottom left, black 0%, black 30%, transparent 65%)',
          transform: 'rotate(12deg)',
          transformOrigin: 'bottom left'
        }}
      ></div>
      

      <div 
        className="absolute bottom-0 right-0 w-96 h-96 opacity-60" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at bottom right, black 0%, black 30%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle at bottom right, black 0%, black 30%, transparent 65%)',
          transform: 'rotate(-12deg)',
          transformOrigin: 'bottom right'
        }}
      ></div>
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-600/15 rounded-full blur-3xl"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-zinc-700/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-sm rounded-2xl p-8 bg-zinc-900/40 border border-zinc-700/50">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
            <p className="text-gray-400 text-sm mb-6">Please check your email for verification</p>
            <button 
              className="w-full py-3.5 bg-white hover:bg-gray-100 active:bg-gray-200 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-[15px]"
              onClick={handleReturningHome}
            >
              <span className="text-white">Return to sign in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

return (
<div className="min-h-screen h-screen bg-zinc-900 flex items-center justify-center px-4 relative overflow-hidden">

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
  

  <div 
    className="absolute bottom-0 left-0 w-96 h-96 opacity-60" 
    style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      maskImage: 'radial-gradient(circle at bottom left, black 0%, black 30%, transparent 65%)',
      WebkitMaskImage: 'radial-gradient(circle at bottom left, black 0%, black 30%, transparent 65%)',
      transform: 'rotate(12deg)',
      transformOrigin: 'bottom left'
    }}
  ></div>
  

  <div 
    className="absolute bottom-0 right-0 w-96 h-96 opacity-60" 
    style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      maskImage: 'radial-gradient(circle at bottom right, black 0%, black 30%, transparent 65%)',
      WebkitMaskImage: 'radial-gradient(circle at bottom right, black 0%, black 30%, transparent 65%)',
      transform: 'rotate(-12deg)',
      transformOrigin: 'bottom right'
    }}
  ></div>
  
  <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl"></div>
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-600/15 rounded-full blur-3xl"></div>
  <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-zinc-700/10 rounded-full blur-3xl"></div>
  
  <div className="w-full max-w-md relative z-10">
    <div className="text-center mb-10">
      <div className="inline-block mb-3">
        <img 
          src="/undefinedlogo.png" 
          alt="logo" 
          className="h-32 w-auto mx-auto drop-shadow-lg"
        />
      </div>
      <p className="text-gray-500 text-sm font-light">{t('startYourLearningJourney')}</p>
    </div>

    <div className="backdrop-blur-sm rounded-2xl p-8 bg-zinc-900/40 border border-zinc-700/50">
      
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 mb-6 shadow-sm hover:shadow-md group"
      >
        <img src="/google.png" alt="Google" className="w-5 h-5" />
        <span className="text-[15px] text-white">{t('continueWithGoogle')}</span>
      </button>

      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-zinc-700 grow"></div>
        <span className="px-4 text-xs text-gray-500 font-medium uppercase tracking-wider">or</span>
        <div className="border-t border-zinc-700 grow"></div>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2.5">
            {t('name')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faUser} className="text-gray-500 text-sm" />
            </div>
            <input 
              className="w-full ltr:pl-11 rtl:pr-11 ltr:pr-4 rtl:pl-4 py-3.5 bg-black/50 border border-zinc-700/70 rounded-xl text-white text-[15px] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition duration-200 hover:border-zinc-600"
              type="text"
              name="name"
              id="userName" 
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="userNewEmail" className="block text-sm font-medium text-gray-300 mb-2.5">
            {t('email')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 text-sm" />
            </div>
            <input 
              className="w-full ltr:pl-11 rtl:pr-11 ltr:pr-4 rtl:pl-4 py-3.5 bg-black/50 border border-zinc-700/70 rounded-xl text-white text-[15px] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition duration-200 hover:border-zinc-600"
              type="email"
              name="newEmail"
              id="userNewEmail" 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="youremail@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="userNewPassword" className="block text-sm font-medium text-gray-300 mb-2.5">
            {t('password')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-gray-500 text-sm" />
            </div>
            <input 
              className="w-full ltr:pl-11 rtl:pr-11 ltr:pr-12 rtl:pl-12 py-3.5 bg-black/50 border border-zinc-700/70 rounded-xl text-white text-[15px] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition duration-200 hover:border-zinc-600"
              type={showPassword ? "text" : "password"}
              name="newPassword"
              id="userNewPassword"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-4 rtl:pl-4 flex items-center cursor-pointer text-gray-500 hover:text-gray-300 transition-colors"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-red-400 text-sm font-medium text-center">{error}</p>
          </div>
        )}

        <button 
          className="w-full py-3.5 bg-white hover:bg-gray-100 active:bg-gray-200 font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:hover:shadow-lg text-[15px] mt-2"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2 text-white">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              {t('creatingAccount')}
            </span>
          ) : (
            <span className="text-white">{t('signup')}</span>
          )}
        </button>

      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          {t('alreadyHaveAccount')}{' '}
          <Link 
            to="/signin" 
            className="text-white font-semibold hover:text-gray-300 transition duration-200 underline decoration-gray-600 underline-offset-2 hover:decoration-gray-400"
          >
            {t('signin')}
          </Link>
          {' · '}
          <LanguageSwitcher />
        </p>
      </div>
    </div>

    <div className="mt-8 text-center">
      <p className="text-gray-600 text-xs">
        © 2026 eyycourses · {t('allRightsReserved')}
      </p>
      <div className="mt-2 flex items-center justify-center gap-3 text-xs">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
          className="text-gray-600 hover:text-gray-400 transition duration-200 underline"
        >
          {t('privacyPolicyLink')}
        </a>
        <span className="text-gray-700">·</span>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
          className="text-gray-600 hover:text-gray-400 transition duration-200 underline"
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