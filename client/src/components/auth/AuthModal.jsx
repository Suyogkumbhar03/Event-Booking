import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaTimes, FaLock, FaEnvelope, FaShieldAlt } from 'react-icons/fa';

const AuthModal = ({ isOpen, onClose, onSuccess, bookingContext }) => {
  const { user, sendOTP, verifyOTP } = useContext(AuthContext);
  const [email, setEmail] = useState(user?.email || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (user?.email) setEmail(user.email);
      setOtp('');
      setStep(1);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await sendOTP(email);
      setStep(2);
      setSuccessMsg(`Verification code dispatched to ${email}`);
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to dispatch OTP verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = await verifyOTP(email, otp);
      setSuccessMsg('Account verified! Proceeding with ticket reservation...');
      onSuccess(data.token, data.user || data);
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/70 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#DCD7CE] w-full max-w-md p-6 sm:p-8 relative shadow-2xl space-y-6 text-[#141413] font-sans">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#52504A] hover:text-[#141413] text-sm"
        >
          <FaTimes />
        </button>

        {/* Header */}
        <div className="border-b border-[#DCD7CE] pb-3 text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FBE9E5] text-[#C84B31] mb-1">
            <FaShieldAlt className="text-lg" />
          </div>
          <span className="font-mono text-[10px] text-[#C84B31] font-bold uppercase tracking-widest block">
            // STEP {step} OF 2: VERIFICATION
          </span>
          <h3 className="font-serif font-bold text-2xl text-[#141413]">
            {step === 1 ? 'Verify Email Address' : 'Your Login Code'}
          </h3>
          <p className="font-mono text-xs text-[#52504A]">
            {step === 1 ? 'Enter your email to receive your 6-digit login code.' : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Pending Booking Details if provided */}
        {bookingContext && (
          <div className="font-mono text-xs bg-[#F9F7F2] p-3 border border-[#DCD7CE] space-y-1">
            <p><strong className="text-[#141413]">Event:</strong> {bookingContext.title}</p>
            <p><strong className="text-[#141413]">Tier:</strong> {bookingContext.tier} (x{bookingContext.quantity})</p>
            <p><strong className="text-[#141413]">Total:</strong> ${bookingContext.totalPrice}</p>
          </div>
        )}

        {/* Error / Success Notifications */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 font-mono text-xs text-center font-bold">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-[#FBE9E5] border border-[#F3C5BC] text-[#C84B31] p-2.5 font-mono text-xs text-center font-bold">
            {successMsg}
          </div>
        )}

        {/* Forms */}
        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[#52504A] font-bold uppercase mb-1 flex items-center gap-1.5">
                <FaEnvelope className="text-[#C84B31] text-xs" /> Email Address
              </label>
              <input
                type="email"
                required
                className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#141413] hover:bg-[#C84B31] text-white font-sans font-bold text-xs uppercase tracking-wider transition"
            >
              {loading ? 'SENDING CODE...' : 'SEND CODE & CONTINUE'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[#C84B31] font-bold uppercase mb-1 flex items-center gap-1.5">
                <FaLock className="text-[#C84B31] text-xs" /> 6-Digit Login Code
              </label>
              <input
                type="text"
                required
                maxLength="6"
                className="w-full p-3 bg-[#F9F7F2] border border-[#C84B31] text-[#141413] font-bold tracking-widest text-center text-lg focus:outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="------"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setSuccessMsg(''); }}
                className="py-3 px-4 bg-white border border-[#DCD7CE] text-[#52504A] hover:text-[#141413] font-sans font-bold text-xs uppercase transition"
              >
                Change Email
              </button>
              <button
                type="submit"
                disabled={loading || !otp}
                className="flex-1 py-3.5 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider transition"
              >
                {loading ? 'VERIFYING...' : 'VERIFY CODE & COMPLETE BOOKING'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
