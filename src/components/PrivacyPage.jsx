import { Link } from 'react-router-dom';
import { useTranslation } from '../../node_modules/react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-900 py-12 px-4">
      <LanguageSwitcher />
      
      <div className="max-w-4xl mx-auto bg-zinc-800 rounded-2xl p-8 border border-zinc-700">
        <Link to="/signin" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
          ← Back to Sign In
        </Link>
        
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
          <p className="text-sm text-gray-500">Last updated: January 5, 2026</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and email address</li>
              <li>Password (encrypted)</li>
              <li>Access code for verification</li>
              <li>Course progress and learning data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your account registration and manage your access</li>
              <li>Send you technical notices and support messages</li>
              <li>Track your learning progress and provide personalized content</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in operating our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of sensitive data</li>
              <li>Secure authentication systems</li>
              <li>Regular security audits</li>
              <li>Limited access to personal information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account</li>
              <li>Object to processing of your personal information</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Cookies and Tracking</h2>
            <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Children's Privacy</h2>
            <p>Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Changes to This Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p className="text-white">support@eyycourses.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
