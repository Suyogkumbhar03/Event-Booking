import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaTicketAlt, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();

  return (
    <header className="bg-[#F9F7F2] border-b border-[#DCD7CE] sticky top-0 z-50">
      
      {/* Top Gazette Micro Header */}
      <div className="border-b border-[#DCD7CE] py-1.5 px-4 font-mono text-[10px] text-[#52504A] flex justify-between items-center tracking-wider font-medium">
        <span>{currentDate}</span>
      </div>

      {/* Main Newspaper Masthead Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Brand Serif Masthead */}
          <Link to="/" className="flex items-center gap-3 group text-center md:text-left">
            <div className="w-10 h-10 border border-[#141413] bg-white flex items-center justify-center font-serif font-bold text-xl text-[#141413] group-hover:border-[#C84B31] group-hover:text-[#C84B31] transition shadow-xs">
              E
            </div>
            <div>
              <h1 className="font-serif font-black text-3xl tracking-tight text-[#141413] group-hover:text-[#C84B31] transition leading-none">
                EVENTORA
              </h1>
              <span className="font-sans text-[10px] tracking-widest text-[#52504A] uppercase block mt-0.5 font-bold">
                CULTURAL GAZETTE & ASSEMBLY PASSES
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6 font-sans text-xs font-semibold tracking-wider">
            <Link 
              to="/" 
              className="text-[#141413] hover:text-[#C84B31] transition uppercase border-b-2 border-transparent hover:border-[#C84B31] py-1 font-bold"
            >
              Events
            </Link>

            {user ? (
              <div className="flex items-center gap-4 border-l border-[#DCD7CE] pl-6">
                {user.role === 'admin' ? (
                  <Link 
                    to="/admin" 
                    className="text-[#C84B31] font-mono font-bold hover:underline uppercase py-1 text-xs tracking-wider"
                  >
                    Admin Panel
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="text-[#141413] font-bold hover:text-[#C84B31] transition uppercase py-1 text-xs"
                    >
                      My Tickets
                    </Link>

                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-2 py-2 px-3.5 bg-white border border-[#DCD7CE] hover:border-[#141413] text-[#141413] transition shadow-xs"
                    >
                      <FaTicketAlt className="text-[#C84B31] text-xs" />
                      <span className="font-mono text-xs font-bold">{user.name.split(' ')[0]}</span>
                      {user.isVerified && (
                        <span className="text-[9px] bg-[#FBE9E5] text-[#C84B31] font-bold px-1.5 py-0.5 border border-[#F3C5BC] uppercase">
                          VERIFIED
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <button 
                  onClick={handleLogout} 
                  className="p-2 border border-[#DCD7CE] bg-white text-[#52504A] hover:text-[#C84B31] hover:border-[#C84B31] transition"
                  title="Logout"
                >
                  <FaSignOutAlt className="text-xs" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="text-[#141413] font-bold hover:text-[#C84B31] transition uppercase py-2 px-3"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition border border-[#C84B31] shadow-xs"
                >
                  Register Pass
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
