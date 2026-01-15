import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import LoadingLogo from './LoadingLogo';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const orderRef = searchParams.get('order_ref');
      
      if (!orderRef) {
        setError('Invalid payment reference');
        setVerifying(false);
        return;
      }

      try {
        // Call verification function
        const { data, error: functionError } = await supabase.functions.invoke('verify-telr-payment', {
          body: { order_ref: orderRef }
        });

        if (functionError) throw functionError;

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.status === 'completed') {
          // Payment successful! 
          setVerifying(false);
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          throw new Error('Payment verification failed');
        }

      } catch (err) {
        console.error('Verification error:', err);
        setError(err.message || 'Failed to verify payment');
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingLogo size="xl" />
          <p className="text-zinc-400 mt-4">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md text-center">
        <div className="text-green-500 text-6xl mb-4">
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-zinc-400 mb-6">
          Your payment has been processed successfully. You now have full access to all courses!
        </p>
        <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          <span>Redirecting to dashboard...</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
