import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faSpinner } from '@fortawesome/free-solid-svg-icons';
import LoadingLogo from './LoadingLogo';

const TelrPayment = () => {
  const { session } = UserAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initiatePayment = async () => {
    if (!session?.user) {
      setError('Please sign in to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate unique order reference
      const orderRef = `ORDER-${Date.now()}-${session.user.id.substring(0, 8)}`;

      console.log('Initiating payment with order ref:', orderRef);

      // Get the current session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('Current session status:', {
        hasSession: !!currentSession,
        hasAccessToken: !!currentSession?.access_token,
        tokenLength: currentSession?.access_token?.length,
        userId: currentSession?.user?.id
      });
      
      if (!currentSession) {
        throw new Error('No active session found. Please sign in again.');
      }

      console.log('Calling Edge Function with token:', currentSession.access_token.substring(0, 20) + '...');

      // Call your Supabase Edge Function with auth header
      const { data, error: functionError } = await supabase.functions.invoke('create-telr-payment', {
        body: {
          amount: 99.00, // Price in AED (or your currency)
          currency: 'AED',
          description: 'eyycourses Full Access',
          orderRef: orderRef,
          customerEmail: session.user.email,
          customerName: session.user.user_metadata?.name || 'Customer'
        }
      });

      console.log('Function response:', { data, functionError });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Edge Function error');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Redirect to Telr payment page
      if (data?.paymentUrl) {
        console.log('Redirecting to payment URL:', data.paymentUrl);
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No payment URL received from Telr');
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Get Full Access</h2>
            <p className="text-zinc-400 text-sm">
              Unlock all courses and features on eyycourses
            </p>
          </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-white mb-2">
            99 AED
          </div>
          <p className="text-zinc-500 text-sm">One-time payment</p>
        </div>

        <div className="space-y-3 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#c96f49] rounded-full"></div>
            <span>Access to all courses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#c96f49] rounded-full"></div>
            <span>Lifetime access</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#c96f49] rounded-full"></div>
            <span>Progress tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#c96f49] rounded-full"></div>
            <span>Certificate of completion</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={initiatePayment}
          disabled={loading}
          className="w-full bg-[#c96f49] hover:bg-[#b85f39] text-white font-medium py-3 px-6 rounded-lg 
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCreditCard} />
              Pay with Card
            </>
          )}
        </button>

        <div className="text-center text-xs text-zinc-500">
          <p>Secure payment powered by Telr</p>
          <p className="mt-1">🔒 Your payment information is encrypted</p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default TelrPayment;
