import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaTicketAlt, FaTrash, FaTimes, FaCheckCircle, FaCalendarAlt, FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';
import TicketReceipt from '../components/ui/TicketReceipt';

const UserDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicketModal, setActiveTicketModal] = useState(location.state?.newlyCreatedBooking || null);

  useEffect(() => {
    const storedToken = token || localStorage.getItem('token');
    if (!storedToken && !user) {
      navigate('/login');
      return;
    }
    fetchMyTickets();
  }, [user, token, navigate]);

  useEffect(() => {
    if (location.state?.newlyCreatedBooking) {
      setActiveTicketModal(location.state.newlyCreatedBooking);
    }
  }, [location.state]);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const storedToken = token || localStorage.getItem('token');
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
      
      const { data } = await api.get('/bookings/my-tickets', { headers });
      setBookings(data);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      // Fallback endpoint check
      try {
        const storedToken = token || localStorage.getItem('token');
        const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
        const { data } = await api.get('/bookings/my', { headers });
        setBookings(data);
      } catch (fallbackErr) {
        console.error('Fallback fetch error:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    if (window.confirm('Are you sure you want to void this ticket receipt?')) {
      try {
        const storedToken = token || localStorage.getItem('token');
        const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
        await api.delete(`/bookings/${id}`, { headers });
        fetchMyTickets();
      } catch (error) {
        alert(error.response?.data?.message || 'Error cancelling booking');
      }
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center font-mono text-[#52504A] text-xs tracking-widest uppercase">
        // RETRIEVING ARCHIVAL TICKET DRAWER...
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 font-sans">
      
      {/* Editorial Header */}
      <div className="bg-white border border-[#DCD7CE] p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 border border-[#141413] bg-[#F9F7F2] flex items-center justify-center font-serif font-bold text-2xl text-[#141413] shrink-0 shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-3xl text-[#141413]">{user?.name || 'Verified Attendee'}</h1>
              <span className="font-mono text-[10px] bg-[#FBE9E5] text-[#C84B31] font-bold px-2 py-0.5 border border-[#F3C5BC] uppercase">
                VERIFIED USER
              </span>
            </div>
            <p className="font-mono text-xs text-[#52504A]">
              <span>{user?.email}</span> • <span className="text-[#C84B31] font-bold uppercase">{user?.role || 'Attendee'} ROLE</span>
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="py-3 px-6 bg-[#141413] hover:bg-[#C84B31] text-white font-sans font-bold text-xs uppercase tracking-wider transition"
        >
          BROWSE EVENTS
        </Link>
      </div>

      {/* Ticket Receipts Header */}
      <div className="flex justify-between items-center border-b border-[#DCD7CE] pb-4 font-mono">
        <h2 className="text-xl font-bold text-[#141413] flex items-center gap-2">
          <FaTicketAlt className="text-[#C84B31] text-sm" /> MY BOOKED TICKETS ({bookings.length})
        </h2>
        <span className="text-xs text-[#52504A] uppercase">// CONFIRMATIONS</span>
      </div>

      {/* Ticket Receipts List or Clean Placeholder */}
      {bookings.length === 0 ? (
        <div className="py-24 text-center bg-white border border-[#DCD7CE] p-12 space-y-4 shadow-sm">
          <FaTicketAlt className="text-3xl text-[#52504A] mx-auto opacity-40" />
          <p className="font-serif text-2xl font-bold text-[#141413]">You have not booked any tickets yet.</p>
          <p className="font-sans text-xs text-[#52504A] max-w-md mx-auto">
            You currently have no active event bookings. Explore upcoming events to reserve your tickets.
          </p>
          <Link
            to="/"
            className="inline-block mt-4 py-3 px-6 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow-xs"
          >
            EXPLORE EVENTS &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {bookings.map((booking) => {
            const eventObj = booking.event || booking.eventId || {};
            const eventDate = eventObj.date ? new Date(eventObj.date) : new Date();
            const formattedDate = isNaN(eventDate.getTime()) ? 'UPCOMING EVENT' : eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }).toUpperCase();

            return (
              <div key={booking._id} className="bg-white border border-[#DCD7CE] shadow-sm hover:border-[#141413] transition space-y-4 p-5 relative">
                {/* Card Top Banner */}
                {eventObj.bannerImage && (
                  <div className="h-36 overflow-hidden -mx-5 -mt-5 mb-3 relative border-b border-[#DCD7CE]">
                    <img src={eventObj.bannerImage} alt={eventObj.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-[#141413] text-white font-mono text-[9px] font-bold px-2 py-0.5 uppercase">
                      {booking.tier || 'Standard Ticket'}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="text-[#C84B31] font-bold">{booking.bookingRef || 'EVT-STUB'}</span>
                    <span className="px-2 py-0.5 bg-[#FBE9E5] text-[#C84B31] border border-[#F3C5BC] font-bold uppercase">
                      {booking.paymentStatus || 'Paid'}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-xl text-[#141413] leading-snug">
                    {eventObj.title || 'Event Booking'}
                  </h3>

                  <div className="space-y-1 font-mono text-xs text-[#52504A] pt-1">
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-[#C84B31] text-xs" />
                      <span>{formattedDate} • {eventObj.time || '20:00'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-[#C84B31] text-xs" />
                      <span className="truncate">{eventObj.venue?.name || eventObj.location || 'Venue Auditorium'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCD7CE] flex items-center justify-between font-mono text-xs">
                  <button
                    onClick={() => setActiveTicketModal(booking)}
                    className="flex-1 py-2 bg-[#141413] hover:bg-[#C84B31] text-white font-bold text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                  >
                    <FaExternalLinkAlt className="text-[10px]" /> View Digital Ticket
                  </button>

                  {booking.paymentStatus !== 'Refunded' && (
                    <button
                      onClick={() => cancelBooking(booking._id)}
                      className="p-2 text-red-700 hover:text-red-900 transition ml-2"
                      title="Cancel Booking"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Pass Modal */}
      {activeTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCD7CE] w-full max-w-md p-4 sm:p-6 relative shadow-2xl text-[#141413] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveTicketModal(null)}
              className="absolute top-3 right-3 text-[#52504A] hover:text-[#141413] text-sm z-10"
            >
              <FaTimes />
            </button>

            <div className="text-center space-y-0.5 mb-3 border-b border-[#DCD7CE] pb-3">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FBE9E5] text-[#C84B31] mb-1">
                <FaCheckCircle className="text-base" />
              </div>
              <h2 className="font-serif font-bold text-xl text-[#141413]">Digital Ticket Pass</h2>
              <p className="font-mono text-[11px] text-[#52504A]">
                Official confirmed ticket pass.
              </p>
            </div>

            <TicketReceipt booking={activeTicketModal} onCloseModal={() => setActiveTicketModal(null)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;
