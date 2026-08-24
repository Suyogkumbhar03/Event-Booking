import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || err;
            setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-12 bg-white p-8 border border-[#DCD7CE] shadow-sm space-y-6 font-sans">
            <div className="text-center space-y-2 border-b border-[#DCD7CE] pb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F9F7F2] border border-[#141413] text-[#141413] font-serif font-bold text-2xl mb-2 shadow-xs">
                    E
                </div>
                <h2 className="font-serif font-bold text-3xl text-[#141413]">Create Account</h2>
                <p className="font-mono text-xs text-[#52504A]">// JOIN EVENTORA CULTURAL GAZETTE</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 font-mono text-xs text-center font-bold">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div>
                    <label className="block text-[#52504A] font-bold uppercase mb-1">Full Name</label>
                    <input
                        type="text"
                        required
                        placeholder="Your full name"
                        className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
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
                        placeholder="Min. 6 characters"
                        className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider transition border border-[#C84B31] mt-4 shadow-xs"
                >
                    {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </button>
            </form>

            <p className="text-center pt-4 border-t border-[#DCD7CE] font-sans text-xs text-[#52504A]">
                Already registered? <Link to="/login" className="text-[#C84B31] font-bold hover:underline">Sign in</Link>
            </p>
        </div>
    );
};

export default Register;
