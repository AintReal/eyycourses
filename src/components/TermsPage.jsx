import { Link } from 'react-router-dom';
import { useTranslation } from '../../node_modules/react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const TermsOfService = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-900 py-12 px-4">
      <LanguageSwitcher />
      
      <div className="max-w-4xl mx-auto bg-zinc-800 rounded-2xl p-8 border border-zinc-700">
        <Link to="/signin" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
          ← Back to Sign In
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
          <p className="text-sm text-gray-500">Last updated: January 5, 2026</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using eyycourses, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Use License</h2>
            <p>Permission is granted to temporarily access the materials (information or software) on eyycourses for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Account Registration</h2>
            <p>To access certain features of the service, you must register for an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password</li>
              <li>Accept all responsibility for activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Access Codes</h2>
            <p>Access codes are single-use only and non-transferable. You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Share your access code with others</li>
              <li>Attempt to use multiple access codes</li>
              <li>Generate or distribute unauthorized access codes</li>
              <li>Circumvent the access code verification system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. User Conduct</h2>
            <p>You agree not to use the service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Transmit harmful or malicious code</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with the proper functioning of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Content Ownership</h2>
            <p>All course materials, including but not limited to text, graphics, logos, and software, are the property of eyycourses or its content suppliers and are protected by international copyright laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Disclaimer</h2>
            <p>The materials on eyycourses are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Limitations</h2>
            <p>In no event shall eyycourses or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on eyycourses.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Revisions</h2>
            <p>The materials appearing on eyycourses could include technical, typographical, or photographic errors. We do not warrant that any of the materials are accurate, complete, or current. We may make changes to the materials at any time without notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. Governing Law</h2>
            <p>These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">12. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us at:</p>
            <p className="text-white">support@eyycourses.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
