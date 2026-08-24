import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaTimes, FaLock, FaShieldAlt } from 'react-icons/fa';

/**
 * AuthModal — shown when a logged-in user clicks "Book Ticket".
 * Asks for their password to confirm identity before booking.
 */
const AuthModal = ({ isOpen, onClose, onSuccess, bookingContext }) => {
  const { user, verifyPassword } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password to confirm.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyPassword(user?.email, password);
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || err;
      setError(typeof msg === 'string' ? msg : 'Incorrect password. Please try again.');
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
            // CONFIRM YOUR IDENTITY
          </span>
          <h3 className="font-serif font-bold text-2xl text-[#141413]">Confirm Booking</h3>
          <p className="font-mono text-xs text-[#52504A]">
            Enter your password to complete this reservation.
          </p>
        </div>

        {/* Booking Summary */}
        {bookingContext && (
          <div className="font-mono text-xs bg-[#F9F7F2] p-3 border border-[#DCD7CE] space-y-1">
            <p><strong className="text-[#141413]">Event:</strong> {bookingContext.title}</p>
            <p><strong className="text-[#141413]">Tier:</strong> {bookingContext.tier} × {bookingContext.quantity}</p>
            <p><strong className="text-[#141413]">Total:</strong> ${bookingContext.totalPrice}</p>
          </div>
        )}

        {/* Signed-in-as indicator */}
        <p className="font-mono text-xs text-[#52504A] text-center">
          Booking as <strong className="text-[#141413]">{user?.email}</strong>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 font-mono text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[#52504A] font-bold uppercase mb-1 flex items-center gap-1.5">
              <FaLock className="text-[#C84B31] text-xs" /> Password
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Your account password"
              className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-white border border-[#DCD7CE] text-[#52504A] hover:text-[#141413] font-sans font-bold text-xs uppercase transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider transition"
            >
              {loading ? 'VERIFYING...' : 'CONFIRM & BOOK NOW'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
