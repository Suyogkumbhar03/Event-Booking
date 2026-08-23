import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [authMode, setAuthMode] = useState('otp');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [isTimerActive, setIsTimerActive] = useState(false);

    const { sendOTP, verifyOTP, login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        let interval = null;
        if (isTimerActive && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setIsTimerActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, resendTimer]);

    const handleSendCode = async (e) => {
        if (e) e.preventDefault();
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
            setResendTimer(60);
            setIsTimerActive(true);
        } catch (err) {
            setError(typeof err === 'string' ? err : err.message || 'Failed to send OTP code');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0 || isTimerActive) return;
        setError('');
        setSuccessMsg('');
        setLoading(true);
        try {
            await sendOTP(email);
            setSuccessMsg('A fresh verification code has been dispatched.');
            setResendTimer(60);
            setIsTimerActive(true);
        } catch (err) {
            setError(typeof err === 'string' ? err : err.message || 'Failed to resend verification code');
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
        try {
            const data = await verifyOTP(email, otp);
            setSuccessMsg('Pass Verified! Checking booking requests...');
            
            const pendingStr = sessionStorage.getItem('pendingBooking');
            let newlyCreatedBooking = null;
            if (pendingStr) {
                try {
                    const pendingData = JSON.parse(pendingStr);
                    const bookingRes = await api.post('/bookings', pendingData, {
                        headers: { Authorization: `Bearer ${data.token}` }
                    });
                    sessionStorage.removeItem('pendingBooking');
                    newlyCreatedBooking = bookingRes.data.booking || bookingRes.data;
                } catch (bookingErr) {
                    console.warn('Auto booking failed post-OTP:', bookingErr);
                }
            }

            // Immediate redirection without artificial setTimeout delay
            if (data.role === 'admin') {
                navigate('/admin');
            } else if (newlyCreatedBooking) {
                navigate('/dashboard', { state: { showTicketModal: true, newlyCreatedBooking } });
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(typeof err === 'string' ? err : err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await login(email, password);
            if (data.role === 'admin') navigate('/admin');
            else navigate('/dashboard');
        } catch (err) {
            if (err.needsVerification) {
                setStep(2);
                setResendTimer(60);
                setIsTimerActive(true);
                setError('Account not verified. A verification code has been dispatched.');
            } else {
                setError(typeof err === 'string' ? err : err.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-12 bg-white p-8 border border-[#DCD7CE] shadow-sm space-y-6 font-sans text-[#141413]">
            
            {/* Editorial Header */}
            <div className="text-center space-y-2 border-b border-[#DCD7CE] pb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F9F7F2] border border-[#141413] text-[#141413] font-serif font-bold text-2xl mb-2 shadow-xs">
                    E
                </div>
                <h2 className="font-serif font-bold text-3xl text-[#141413]">Sign In to Eventora</h2>
                <p className="font-mono text-xs text-[#52504A]">
                    {step === 1 ? '// VERIFIED ADMISSION & PASS DESK' : `// CODE DISPATCHED TO ${email}`}
                </p>
            </div>

            {/* Notifications */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 font-mono text-xs text-center font-bold">
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="bg-[#FBE9E5] border border-[#F3C5BC] text-[#C84B31] p-3 font-mono text-xs text-center font-bold">
                    {successMsg}
                </div>
            )}

            {/* Mode Switcher */}
            {step === 1 && (
                <div className="flex border-b border-[#DCD7CE] font-mono text-xs">
                    <button
                        type="button"
                        onClick={() => { setAuthMode('otp'); setError(''); }}
                        className={`flex-1 py-2.5 font-bold text-center border-b-2 transition ${authMode === 'otp' ? 'border-[#C84B31] text-[#C84B31]' : 'border-transparent text-[#52504A] hover:text-[#141413]'}`}
                    >
                        EMAIL OTP CODE
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('password'); setError(''); }}
                        className={`flex-1 py-2.5 font-bold text-center border-b-2 transition ${authMode === 'password' ? 'border-[#C84B31] text-[#C84B31]' : 'border-transparent text-[#52504A] hover:text-[#141413]'}`}
                    >
                        PASSWORD LOGIN
                    </button>
                </div>
            )}

            {/* Step 1: Email Input */}
            {step === 1 && authMode === 'otp' && (
                <form onSubmit={handleSendCode} className="space-y-4 font-mono text-xs">
                    <div>
                        <label className="block text-[#52504A] font-bold uppercase mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="name@domain.com"
                            className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider transition border border-[#C84B31] shadow-xs"
                    >
                        {loading ? 'DISPATCHING CODE...' : 'DISPATCH VERIFICATION CODE'}
                    </button>
                </form>
            )}

            {/* Password Login Fallback */}
            {step === 1 && authMode === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4 font-mono text-xs">
                    <div>
                        <label className="block text-[#52504A] font-bold uppercase mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="name@domain.com"
                            className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[#52504A] font-bold uppercase mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-[#141413] hover:bg-[#C84B31] text-white font-sans font-bold text-xs uppercase tracking-wider transition shadow-xs"
                    >
                        {loading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & SIGN IN'}
                    </button>
                </form>
            )}

            {/* Step 2: 6-Digit Numeric OTP Screen */}
            {step === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4 font-mono text-xs">
                    <div>
                        <label className="block text-[#C84B31] font-bold uppercase mb-1 text-center">
                            6-Digit Verification Code
                        </label>
                        <input
                            type="text"
                            required
                            maxLength="6"
                            placeholder="000000"
                            className="w-full p-3.5 bg-[#F9F7F2] border border-[#C84B31] text-[#141413] font-bold text-center text-2xl tracking-[0.4em] focus:outline-none"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full py-3.5 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider transition border border-[#C84B31] shadow-xs"
                    >
                        {loading ? 'VERIFYING CODE...' : 'VERIFY CODE & ISSUE PASS'}
                    </button>

                    <div className="text-center pt-2">
                        {isTimerActive ? (
                            <p className="text-[#52504A]">
                                Resend code in <span className="font-bold text-[#141413]">{resendTimer}s</span>
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={loading}
                                className="font-bold text-[#C84B31] hover:underline focus:outline-none"
                            >
                                Resend Verification Code
                            </button>
                        )}
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => { setStep(1); setOtp(''); setError(''); setSuccessMsg(''); }}
                            className="text-[11px] text-[#52504A] hover:text-[#141413] underline"
                        >
                            Change Email Address
                        </button>
                    </div>
                </form>
            )}

            {/* Footer link */}
            <p className="text-center pt-4 border-t border-[#DCD7CE] font-sans text-xs text-[#52504A]">
                Don't have an account? <Link to="/register" className="text-[#C84B31] font-bold hover:underline">Register Pass</Link>
            </p>
        </div>
    );
};

export default Login;
