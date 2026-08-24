import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { SAMPLE_EVENTS } from '../constants/sampleEvents';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaStamp, FaUser, FaTimes, FaCheckCircle } from 'react-icons/fa';
import TicketReceipt from '../components/ui/TicketReceipt';
import AuthModal from '../components/auth/AuthModal';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Tier & Quantity State
  const [selectedTier, setSelectedTier] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  // Auth & Booking Modal Controls
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  // Confirmed Digital Ticket Pass Modal
  const [confirmedTicket, setConfirmedTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
      if (data.ticketTiers && data.ticketTiers.length > 0) {
        setSelectedTier(data.ticketTiers[0]);
      }
    } catch (err) {
      console.warn('API fetch failed, matching against sample events dataset');
      const sample = SAMPLE_EVENTS.find(e => e._id === id || e.title.toLowerCase().includes(id.toLowerCase()));
      if (sample) {
        setEvent(sample);
        if (sample.ticketTiers && sample.ticketTiers.length > 0) {
          setSelectedTier(sample.ticketTiers[0]);
        }
      } else {
        setEvent(SAMPLE_EVENTS[0]);
        setSelectedTier(SAMPLE_EVENTS[0].ticketTiers[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  // User clicks "Book Ticket" — require logged-in user to confirm with password
  const handleBookingTrigger = async () => {
    setError('');
    
    const targetEventId = event._id || event.customId || event.slug;
    const currentTierName = selectedTier ? selectedTier.name : 'Standard Entry';
    const unitPrice = selectedTier ? selectedTier.price : (event.ticketPrice || 0);
    const subtotal = unitPrice * ticketQuantity;
    const serviceFee = subtotal > 0 ? 5 : 0;
    const totalPrice = subtotal + serviceFee;

    const bookingPayload = {
      eventId: targetEventId,
      tier: currentTierName,
      quantity: ticketQuantity,
      totalPrice: totalPrice,
      title: event.title
    };

    // Show password confirmation modal
    setPendingBooking(bookingPayload);
    setShowAuthModal(true);
  };

  // Execute booking after password is verified
  const executeBookingApi = async (payload) => {
    setBookingLoading(true);
    setError('');
    try {
      const authToken = localStorage.getItem('token');
      const { data } = await api.post('bookings', {
        eventId: payload.eventId,
        tier: payload.tier,
        quantity: payload.quantity,
        totalPrice: payload.totalPrice
      }, { headers: { Authorization: `Bearer ${authToken}` } });

      const createdBooking = data.booking || data;
      setConfirmedTicket(createdBooking);
      setShowAuthModal(false);
      setPendingBooking(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete booking');
    } finally {
      setBookingLoading(false);
    }
  };

  // Password confirmed — proceed with booking
  const handleAuthModalSuccess = async () => {
    setShowAuthModal(false);
    if (pendingBooking) {
      await executeBookingApi(pendingBooking);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center font-mono text-[#52504A] tracking-widest text-xs uppercase">
        // ACCESSING EXHIBITION ARCHIVE...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-24 text-center bg-white border border-[#DCD7CE] p-12 max-w-xl mx-auto">
        <h2 className="font-serif text-2xl font-bold text-[#141413] mb-2">Exhibition Not Found</h2>
        <p className="font-sans text-xs text-[#52504A]">The requested catalog item could not be retrieved.</p>
      </div>
    );
  }

  const tiers = event.ticketTiers && event.ticketTiers.length > 0
    ? event.ticketTiers
    : [{ _id: 't-def', name: 'Standard Admission', price: event.ticketPrice || 0, availableSeats: event.availableSeats || 50 }];

  const currentTier = selectedTier || tiers[0];
  const unitPrice = currentTier.price || 0;
  const subtotal = unitPrice * ticketQuantity;
  const serviceFee = subtotal > 0 ? 5 : 0;
  const grandTotal = subtotal + serviceFee;

  const eventDate = new Date(event.date);
  const formattedDate = isNaN(eventDate.getTime()) ? 'UPCOMING ASSEMBLY' : eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();

  return (
    <div className="space-y-12 pb-20 font-sans">
      
      {/* Top Breadcrumb */}
      <div className="border-b border-[#DCD7CE] pb-4 flex justify-between items-center font-mono text-xs text-[#52504A]">
        <span>EVENTS // {(event.category || 'Cultural').toUpperCase()}</span>
        <span className="text-[#C84B31] font-bold">TICKETS AVAILABLE</span>
      </div>

      {/* Layout Grid */}
      <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'max-w-4xl mx-auto' : 'lg:grid-cols-12'} gap-12 items-start`}>
        
        {/* Main Column */}
        <div className={`${user?.role === 'admin' ? 'w-full' : 'lg:col-span-8'} space-y-8`}>
          
          <div className="bg-white border border-[#DCD7CE] overflow-hidden relative shadow-sm">
            <img
              src={event.bannerImage || event.image}
              alt={event.title}
              className="w-full h-[380px] object-cover filter contrast-[1.05]"
            />
            <div className="absolute top-4 left-4 bg-[#141413] text-white font-mono text-[10px] font-bold px-3 py-1 uppercase tracking-widest border border-white/20">
              EVENT PASS
            </div>
          </div>

          <div className="space-y-4">
            <span className="font-mono text-xs text-[#C84B31] font-bold uppercase tracking-wider block">
              EVENT #{event.customId || 'EVT-2026'}
            </span>

            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[#141413] leading-tight">
              {event.title}
            </h1>

            <div className="flex items-center gap-6 font-mono text-xs text-[#52504A] border-y border-[#DCD7CE] py-3">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-[#C84B31] text-xs" />
                <span className="text-[#141413] font-semibold">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="text-[#C84B31] text-xs" />
                <span className="text-[#141413] font-semibold">{event.time || '20:00'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-[#C84B31] text-xs" />
                <span className="text-[#141413] font-semibold">{event.venue?.name || event.location || 'Main Auditorium'}</span>
              </div>
            </div>

            <p className="font-serif text-[#141413] text-base md:text-lg leading-relaxed pt-2">
              {event.description}
            </p>
          </div>

          {/* Schedule Timeline */}
          <div className="bg-white border border-[#DCD7CE] p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="font-serif font-bold text-2xl text-[#141413] border-b border-[#DCD7CE] pb-3">
              Event Schedule
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-start border-b border-[#DCD7CE] pb-3">
                <div>
                  <span className="text-[#C84B31] font-bold block text-sm">14:00 • DOORS OPEN</span>
                  <span className="text-[#52504A] font-sans text-xs">Reception, ticket check-in, and welcome drinks.</span>
                </div>
                <span className="bg-[#EFEAE1] text-[#141413] px-2 py-1 text-[10px] uppercase font-bold border border-[#DCD7CE]">Arrival</span>
              </div>

              <div className="flex justify-between items-start border-b border-[#DCD7CE] pb-3">
                <div>
                  <span className="text-[#C84B31] font-bold block text-sm">14:30 • MAIN STAGE</span>
                  <span className="text-[#52504A] font-sans text-xs">Keynote performance and main show.</span>
                </div>
                <span className="bg-[#EFEAE1] text-[#141413] px-2 py-1 text-[10px] uppercase font-bold border border-[#DCD7CE]">Main Show</span>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[#C84B31] font-bold block text-sm">17:00 • Q&A & NETWORKING</span>
                  <span className="text-[#52504A] font-sans text-xs">Artist meet & greet and networking session.</span>
                </div>
                <span className="bg-[#EFEAE1] text-[#141413] px-2 py-1 text-[10px] uppercase font-bold border border-[#DCD7CE]">Closing</span>
              </div>
            </div>
          </div>

          {/* Organizer Bio */}
          <div className="bg-[#F9F7F2] border border-[#DCD7CE] p-6 md:p-8 flex items-start justify-between gap-6 relative">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaUser className="text-[#C84B31] text-xs" />
                <span className="font-mono text-xs font-bold text-[#C84B31] uppercase">ORGANIZED BY</span>
              </div>
              <h4 className="font-serif font-bold text-xl text-[#141413]">
                {event.organizer?.name || 'Eventora Team'}
              </h4>
              <p className="font-sans text-xs text-[#52504A] leading-relaxed max-w-md">
                Verified event organizer on Eventora platform.
              </p>
            </div>
            <div className="hidden sm:block opacity-20 transform rotate-6 pointer-events-none">
              <FaStamp className="text-6xl text-[#C84B31]" />
            </div>
          </div>

        </div>

        {/* Sidebar Sticky Booking Box (Only shown for non-admin users) */}
        {user?.role !== 'admin' && (
          <div className="lg:col-span-4 sticky top-6">
            <div className="bg-white border border-[#DCD7CE] p-6 space-y-6 shadow-sm relative">
              
              <div className="border-b border-[#DCD7CE] pb-4">
                <span className="font-mono text-[10px] text-[#C84B31] font-bold uppercase tracking-widest block">// SELECT TICKETS</span>
                <h3 className="font-serif font-bold text-2xl text-[#141413] mt-1">Book Your Tickets</h3>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 font-mono text-xs text-center font-bold">
                  {error}
                </div>
              )}

              {/* Ticket Tier Selection */}
              <div className="space-y-3 font-mono text-xs">
                <label className="text-[#52504A] font-bold uppercase block text-[11px]">SELECT TIER</label>
                {tiers.map((t, idx) => {
                  const isSoldOut = (t.availableSeats !== undefined ? t.availableSeats : 50) <= 0;
                  const isSelected = selectedTier?.name === t.name || (!selectedTier && idx === 0);
                  return (
                    <div
                      key={t._id || idx}
                      onClick={() => !isSoldOut && setSelectedTier(t)}
                      className={`p-3 border transition flex justify-between items-center ${
                        isSoldOut
                          ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-[#C84B31] bg-[#FBE9E5] cursor-pointer'
                          : 'border-[#DCD7CE] bg-white hover:border-[#141413] cursor-pointer'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#141413] block">
                          {t.name} {isSoldOut && <span className="text-red-600 text-[10px] font-bold uppercase">(SOLD OUT)</span>}
                        </span>
                        <span className="text-[10px] text-[#52504A]">
                          {isSoldOut ? '0 seats available' : `${t.availableSeats !== undefined ? t.availableSeats : 50} seats left`}
                        </span>
                      </div>
                      <span className="font-serif font-bold text-base text-[#C84B31]">
                        ${t.price}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between font-mono text-xs border-t border-[#DCD7CE] pt-4">
                <span className="text-[#52504A] font-bold uppercase">QUANTITY</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                    className="w-7 h-7 bg-white border border-[#DCD7CE] font-bold hover:border-[#141413] text-[#141413] flex items-center justify-center"
                  >
                    -
                  </button>

                  <span className="font-bold text-sm w-4 text-center text-[#141413]">{ticketQuantity}</span>

                  <button
                    type="button"
                    onClick={() => {
                      const maxAvailable = (selectedTier || tiers[0])?.availableSeats !== undefined ? (selectedTier || tiers[0]).availableSeats : 6;
                      setTicketQuantity(Math.min(Math.min(6, maxAvailable), ticketQuantity + 1));
                    }}
                    className="w-7 h-7 bg-white border border-[#DCD7CE] font-bold hover:border-[#141413] text-[#141413] flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Summary Breakdown */}
              <div className="space-y-2 font-mono text-xs border-t border-[#DCD7CE] pt-4">
                <div className="flex justify-between text-[#52504A]">
                  <span>SUBTOTAL</span>
                  <span className="text-[#141413] font-bold">${subtotal}</span>
                </div>
                {subtotal > 0 && (
                  <div className="flex justify-between text-[#52504A]">
                    <span>SERVICE FEE</span>
                    <span className="text-[#141413] font-bold">${serviceFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#141413] border-t border-[#DCD7CE] pt-2">
                  <span>TOTAL DUE</span>
                  <span className="text-[#C84B31] text-base font-mono">
                    ${grandTotal}
                  </span>
                </div>
              </div>

              {/* Step 1 Booking Trigger Button */}
              {((selectedTier || tiers[0])?.availableSeats !== undefined ? (selectedTier || tiers[0]).availableSeats : 50) <= 0 ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-4 bg-gray-400 text-white font-sans font-bold text-xs uppercase tracking-wider border border-gray-400 cursor-not-allowed"
                >
                  SOLD OUT
                </button>
              ) : (
                <button
                  type="button"
                  disabled={bookingLoading}
                  onClick={handleBookingTrigger}
                  className="w-full py-4 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider transition border border-[#C84B31] shadow-xs"
                >
                  {bookingLoading ? 'PROCESSING...' : 'CONFIRM & PAY / BOOK TICKET'}
                </button>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Step 3: Auth & OTP Verification Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthModalSuccess}
        bookingContext={pendingBooking}
      />

      {/* Confirmed Ticket Pass Modal */}
      {confirmedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCD7CE] w-full max-w-md p-4 sm:p-6 relative shadow-2xl text-[#141413] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setConfirmedTicket(null)}
              className="absolute top-3 right-3 text-[#52504A] hover:text-[#141413] text-sm z-10"
            >
              <FaTimes />
            </button>

            <div className="text-center space-y-0.5 mb-3 border-b border-[#DCD7CE] pb-3">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FBE9E5] text-[#C84B31] mb-1">
                <FaCheckCircle className="text-base" />
              </div>
              <h2 className="font-serif font-bold text-xl text-[#141413]">Pass Verified & Issued</h2>
              <p className="font-mono text-[11px] text-[#52504A]">
                Your digital ticket pass is confirmed and saved.
              </p>
            </div>

            <TicketReceipt booking={confirmedTicket} onCloseModal={() => setConfirmedTicket(null)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default EventDetail;
